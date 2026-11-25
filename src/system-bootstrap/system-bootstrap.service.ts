import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from '../shared/users/entities/user.entity.js';
import { AccountStatus } from '../shared/users/enum/users.enum.js';
import { Role } from '../shared/rbac/roles/entities/role.entity.js';
import { SystemModule } from '../shared/rbac/enum/system-module.enum.js';
import { UserRoleAssignment } from '../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { Invitation } from '../shared/invitations/entities/invitation.entity.js';
import { PasswordService } from '../auth/password.service.js';

import {
  SystemBootstrap,
  SystemBootstrapStatus,
} from './entities/system-bootstrap.entity.js';

const BOOTSTRAP_KEY = 'INITIAL_SYSTEM_ADMIN';

export interface InitialAdminDetails {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@Injectable()
export class SystemBootstrapService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(SystemBootstrap)
    private readonly bootstrapRepository: Repository<SystemBootstrap>,
  ) {}

  async bootstrapInitialAdmin(details: InitialAdminDetails) {
    const firstName = details.firstName.trim();
    const lastName = details.lastName.trim();
    const email = details.email.trim().toLowerCase();
    const password = details.password;

    if (!firstName || !lastName || !email) {
      throw new BadRequestException(
        'First name, last name, and email are required.',
      );
    }

    if (
      password.length < 12 ||
      password.length > 128 ||
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?=\S+$).+$/.test(
        password,
      )
    ) {
      throw new BadRequestException(
        'Password must be 12-128 characters and contain uppercase, lowercase, number, and special character, with no spaces.',
      );
    }

    const passwordHash = await this.passwordService.hash(password);

    let bootstrap = await this.bootstrapRepository.findOne({
      where: { bootstrapKey: BOOTSTRAP_KEY },
    });

    let user: User;

    if (bootstrap) {
      if (bootstrap.status === SystemBootstrapStatus.COMPLETED) {
        throw new ConflictException(
          'Initial administrator bootstrap has already been completed.',
        );
      }

      const existingAdmin = await this.userRepository.findOne({
        where: { id: bootstrap.initialAdminUserId },
      });

      if (!existingAdmin) {
        throw new NotFoundException(
          'The initial administrator account could not be found.',
        );
      }

      user = existingAdmin;

      if (user.email.toLowerCase() !== email) {
        throw new ConflictException(
          'Initial administrator bootstrap has already started with a different email address.',
        );
      }

      if (user.status !== AccountStatus.PENDING) {
        throw new ConflictException(
          'The initial administrator account is no longer pending.',
        );
      }
    } else {
      user = await this.dataSource.transaction(async (manager) => {
        const users = manager.getRepository(User);
        const roles = manager.getRepository(Role);
        const assignments = manager.getRepository(UserRoleAssignment);
        const bootstraps = manager.getRepository(SystemBootstrap);

        const existingUser = await users.findOne({
          where: { email },
          withDeleted: true,
        });

        if (existingUser) {
          throw new ConflictException(
            'An account with this email already exists. Bootstrap will not modify an existing account.',
          );
        }

        const adminRole = await roles.findOne({
          where: { code: 'SYSTEM_ADMIN', isActive: true },
        });

        if (!adminRole || adminRole.module !== SystemModule.PLATFORM) {
          throw new NotFoundException(
            'The active platform SYSTEM_ADMIN role was not found. Run the RBAC seed first.',
          );
        }

        const newUser = users.create({
          firstName,
          lastName,
          email,
          phoneNumber: null,
          invitationAcceptedAt: null,
          passwordHash: null,
          mustChangePassword: true,
          cadreId: null,
          status: AccountStatus.PENDING,
          lastLoginAt: null,
          createdBy: null,
        });

        const savedUser = await users.save(newUser);

        const assignment = assignments.create({
          userId: savedUser.id,
          roleId: adminRole.id,
          organizationAssignmentId: null,
          assignedBy: null,
          assignedAt: new Date(),
          expiresAt: null,
          revokedAt: null,
          revokedBy: null,
        });

        await assignments.save(assignment);

        const bootstrapRecord = bootstraps.create({
          bootstrapKey: BOOTSTRAP_KEY,
          initialAdminUserId: savedUser.id,
          status: SystemBootstrapStatus.PENDING_INVITATION,
        });

        await bootstraps.save(bootstrapRecord);

        return savedUser;
      });

      bootstrap = await this.bootstrapRepository.findOne({
        where: { bootstrapKey: BOOTSTRAP_KEY },
      });
    }

    if (!bootstrap) {
      throw new Error(
        'Initial administrator bootstrap record was not created.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const invitations = manager.getRepository(Invitation);
      const bootstraps = manager.getRepository(SystemBootstrap);

      const currentBootstrap = await bootstraps.findOne({
        where: { bootstrapKey: BOOTSTRAP_KEY },
      });

      if (
        !currentBootstrap ||
        currentBootstrap.initialAdminUserId !== user.id
      ) {
        throw new ConflictException(
          'Initial administrator bootstrap record has changed.',
        );
      }

      if (currentBootstrap.status === SystemBootstrapStatus.COMPLETED) {
        throw new ConflictException(
          'Initial administrator bootstrap has already been completed.',
        );
      }

      const currentUser = await users.findOne({
        where: { id: user.id },
      });

      if (!currentUser || currentUser.status !== AccountStatus.PENDING) {
        throw new ConflictException(
          'Initial administrator account is no longer pending.',
        );
      }

      const now = new Date();

      await invitations
        .createQueryBuilder()
        .update(Invitation)
        .set({ revokedAt: now })
        .where('userId = :userId', { userId: user.id })
        .andWhere('acceptedAt IS NULL')
        .andWhere('revokedAt IS NULL')
        .execute();

      await users.update(
        { id: user.id },
        {
          passwordHash,
          status: AccountStatus.ACTIVE,
          mustChangePassword: false,
          invitationAcceptedAt: null,
        },
      );

      await bootstraps.update(
        { bootstrapKey: BOOTSTRAP_KEY },
        { status: SystemBootstrapStatus.COMPLETED },
      );
    });

    return {
      message: 'Initial system administrator activated successfully.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: AccountStatus.ACTIVE,
        role: 'SYSTEM_ADMIN',
      },
    };
  }
}
