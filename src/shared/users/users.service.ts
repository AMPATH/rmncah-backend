
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {

  EntityManager,
} from 'typeorm';
import { DataSource, Repository } from 'typeorm';

import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { User } from './entities/user.entity.js';
import { AccountStatus } from './enum/users.enum.js';
import { UserRoleAssignment } from '../rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { SystemModule } from '../rbac/enum/system-module.enum.js';
import { OrganizationLevel } from '../user-organization-assignments/enum/organization-level.enum.js';
import { InvitationsService } from '../invitations/invitations.service.js';
import { SessionsService } from '../../auth/sessions/sessions.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepository: Repository<UserRoleAssignment>,
    private readonly invitationsService: InvitationsService,
    private readonly sessionsService: SessionsService,
    private readonly dataSource: DataSource,
  ) {}

  // Create a new user account.
  async create(
    createUserDto: CreateUserDto,
    createdBy?: string,
    manager?: EntityManager,
  ): Promise<User> {
    const repository = manager
      ? manager.getRepository(User)
      : this.userRepository;

    const email = createUserDto.email.toLowerCase();

    // Check whether email already exists.
    const existingUser = await repository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email is already registered',
      );
    }

    // Check whether phone number already exists.
    if (createUserDto.phoneNumber) {
      const existingPhoneNumber = await repository.findOne({
        where: {
          phoneNumber: createUserDto.phoneNumber,
        },
      });

      if (existingPhoneNumber) {
        throw new ConflictException(
          'Phone number is already registered',
        );
      }
    }

    // Prepare the new pending user account.
    const newUser = repository.create({
      ...createUserDto,
      email,
      passwordHash: null,
      mustChangePassword: true,
      status: AccountStatus.PENDING,
      createdBy: createdBy ?? null,
    });

    // Save using the transaction-aware repository.
    const user = await repository.save(newUser);

    // Invitations must only be issued after the transaction
    // commits. The caller owns the transaction lifecycle.
    if (!manager) {
      await this.invitationsService.issueInvitation(
        user.id,
        createdBy ?? null,
      );
    }
    // Automatically invite the newly created pending account.
    //await this.invitationsService.issueInvitation(user.id, createdBy ?? null);

    return user;
  }

  // Create an EmONC Mentor or Mentee account for an authorised Program Lead.
  async createEmoncMentorMentee(
    createUserDto: CreateUserDto,
    createdBy: string,
    actorOrganizationAssignmentId: string,
  ): Promise<User> {
    if (!actorOrganizationAssignmentId) {
      throw new ForbiddenException(
        'An active county organization assignment is required.',
      );
    }

    const now = new Date();

    // Verify the caller's active EMONC Program Lead role and county assignment.
    const actorRoleAssignment = await this.userRoleAssignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.role', 'role')
      .innerJoin('assignment.user', 'actorUser')
      .innerJoinAndSelect(
        'assignment.organizationAssignment',
        'organizationAssignment',
      )
      .where('assignment.userId = :createdBy', { createdBy })
      .andWhere('actorUser.status = :accountStatus', {
        accountStatus: AccountStatus.ACTIVE,
      })
      .andWhere('assignment.organizationAssignmentId = :organizationAssignmentId', {
        organizationAssignmentId: actorOrganizationAssignmentId,
      })
      .andWhere('role.code = :roleCode', { roleCode: 'PROGRAM_LEAD' })
      .andWhere('role.module = :module', { module: SystemModule.EMONC })
      .andWhere('role.isActive = :roleIsActive', { roleIsActive: true })
      .andWhere('assignment.revokedAt IS NULL')
      .andWhere('(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)', {
        now,
      })
      .andWhere(
        'organizationAssignment.userId = :createdBy',
        { createdBy },
      )
      .andWhere('organizationAssignment.level = :level', {
        level: OrganizationLevel.COUNTY,
      })
      .andWhere('organizationAssignment.endDate IS NULL')
      .andWhere('organizationAssignment.startDate <= :now', { now })
      .getOne();

    if (!actorRoleAssignment?.organizationAssignment) {
      throw new ForbiddenException(
        'Only an active EMONC Program Lead with a valid county assignment can create Mentor or Mentee accounts.',
      );
    }

    // Reuse the existing invitation-based account creation flow.
    // Role and facility assignments are deliberately handled separately.
    return this.create(createUserDto, createdBy);
  }

  // Retrieve all users
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Retrieve one user by ID.
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found`,
      );
    }

    return user;
  }

  // Find user by email.
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  // Find user by email, including password hash.
  async findByEmailWithPassword(
    email: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', {
        email: email.toLowerCase(),
      })
      .getOne();
  }

  // Find a user by ID and explicitly include password hash.
  async findByIdWithPassword(
    id: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  // Update password only if the verified hash has not changed.
  async updatePasswordIfUnchanged(
    id: string,
    currentPasswordHash: string,
    newPasswordHash: string,
  ): Promise<boolean> {
    const result = await this.userRepository.update(
      {
        id,
        passwordHash: currentPasswordHash,
      },
      {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    );

    return (result.affected ?? 0) === 1;
  }

  // Update last successful login timestamp.
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  // Update user details.
  async update(
    id: string,
    updateData: UpdateUserDto & {
      status?: AccountStatus;
    },
  ): Promise<User> {
    const user = await this.findOne(id);

    if (updateData.email) {
      const email = updateData.email.toLowerCase();

      const existingUser = await this.findByEmail(email);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          'Email is already registered',
        );
      }

      updateData.email = email;
    }

    Object.assign(user, updateData);

    return this.userRepository.save(user);
  }

  // Delete user.
  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepository.delete(id);
  }
  // Soft-deactivate a user account and revoke its access.

  async deactivate(id: string, deletedBy: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      // Check that the account exists before changing related records.
      const existingUser = await userRepository.findOne({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (existingUser.status === AccountStatus.DEACTIVATED) {
        throw new ConflictException('User account is already deactivated');
      }

      // Revoke invitations before locking the user.
      // Invitation acceptance locks the invitation before the user,
      await this.invitationsService.revokeUserInvitations(id, manager);

      // Lock the account before changing its status.
      const user = await userRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (user.status === AccountStatus.DEACTIVATED) {
        throw new ConflictException('User account is already deactivated');
      }

      // Preserve the account's previous status for restoration.
      user.statusBeforeDeletion = user.status;
      user.status = AccountStatus.DEACTIVATED;
      user.deletedBy = deletedBy;

      await userRepository.save(user);

      // Revoke all active login sessions in this transaction.
      await this.sessionsService.revokeAllSessions(id, manager);

      // Set deletedAt using TypeORM's soft-delete mechanism.
      await userRepository.softDelete(id);
    });
  }

  // Restore a previously soft-deactivated user account.
  async restore(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      // Include soft-deleted accounts and lock the selected record.
      const user = await userRepository.findOne({
        where: { id },
        withDeleted: true,
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (!user.deletedAt) {
        throw new ConflictException('User account is not deactivated');
      }

      if (!user.statusBeforeDeletion) {
        throw new ConflictException(
          'Previous account status is unavailable; manual review is required',
        );
      }

      // Restore the exact status that existed before deactivation.
      user.status = user.statusBeforeDeletion;
      user.statusBeforeDeletion = null;
      user.deletedBy = null;

      await userRepository.recover(user);
    });
  }
}
