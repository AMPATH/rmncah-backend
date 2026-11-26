
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
  SelectQueryBuilder,
  Brackets,
} from 'typeorm';

import { User } from '../../shared/users/entities/user.entity.js';
import { UsersService } from '../../shared/users/users.service.js';
import { AccountStatus } from '../../shared/users/enum/users.enum.js';

import { OrganizationLevel } from '../../shared/user-organization-assignments/enum/organization-level.enum.js';
import { UserOrganizationAssignmentsService } from '../../shared/user-organization-assignments/user-organization-assignments.service.js';

import { UserRoleAssignmentsService } from '../../shared/rbac/user-role-assignments/user-role-assignments.service.js';
import { RolesService } from '../../shared/rbac/roles/roles.service.js';

import { UserRoleAssignment } from '../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { Role } from '../../shared/rbac/roles/entities/role.entity.js';
import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';

import { InvitationsService } from '../mentors/invitations/invitations.service.js';
import { CreateMenteeDto } from './dto/create-mentee.dto.js';

@Injectable()
export class MenteesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly usersService: UsersService,

    private readonly organizationAssignmentsService:
      UserOrganizationAssignmentsService,

    private readonly userRoleAssignmentsService:
      UserRoleAssignmentsService,

    private readonly rolesService: RolesService,

    private readonly invitationsService: InvitationsService,
  ) {}

  /**
   * Create a mentee account.
   *
   * Flow:
   * 1. Create pending user account.
   * 2. Assign user to a facility.
   * 3. Find the active EMONC MENTEE role.
   * 4. Assign the MENTEE role.
   * 5. Send account invitation.
   */
  async create(dto: CreateMenteeDto, createdBy: string) {
    // 1. Create the mentee user account.
    const mentee = await this.usersService.create(
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        cadreId: dto.cadreId,
      },
      createdBy,
    );

    // 2. Assign the mentee to the selected facility.
    const organizationAssignment =
      await this.organizationAssignmentsService.create(
        {
          userId: mentee.id,
          level: OrganizationLevel.FACILITY,
          facilityId: dto.facilityId,
        },
        createdBy,
      );

    // 3. Find the active EMONC MENTEE role.
    const menteeRole = await this.rolesService.findByCode('MENTEE');

    if (
      !menteeRole ||
      menteeRole.module !== SystemModule.EMONC ||
      !menteeRole.isActive
    ) {
      throw new NotFoundException(
        'Active EMONC MENTEE role not found',
      );
    }

    // 4. Assign the MENTEE role to the facility assignment.
    await this.userRoleAssignmentsService.assignRole(
      {
        userId: mentee.id,
        roleId: menteeRole.id,
        organizationAssignmentId: organizationAssignment.id,
      },
      createdBy,
    );

    // 5. Send account invitation.
    const invitation =
      await this.invitationsService.createInvitation(mentee.id);

    return {
      message: 'Mentee created and invitation sent successfully',
      mentee,
      invitation: {
        id: invitation.invitationId,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  /**
   * Base query for identifying legitimate EMONC mentees.
   *
   * A user qualifies only if they have:
   * - An active facility-level organization assignment.
   * - An active EMONC MENTEE role assigned to that organization.
   * - A non-expired, non-revoked role assignment.
   * - No soft deletion.
   */
  private createMenteeQuery(): SelectQueryBuilder<User> {
    const now = new Date();

    return this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phoneNumber',
        'user.status',
        'user.cadreId',
        'user.createdAt',
      ])
      .innerJoinAndSelect(
        'user.organizationAssignments',
        'organizationAssignment',
        `
          organizationAssignment.level = :level
          AND organizationAssignment.endDate IS NULL
          AND organizationAssignment.startDate <= :now
        `,
        {
          level: OrganizationLevel.FACILITY,
          now,
        },
      )
      .innerJoin(
        UserRoleAssignment,
        'roleAssignment',
        `
          roleAssignment.userId = user.id
          AND roleAssignment.organizationAssignmentId = organizationAssignment.id
        `,
      )
      .innerJoin(
        Role,
        'role',
        'role.id = roleAssignment.roleId',
      )
      .where('role.code = :roleCode', {
        roleCode: 'MENTEE',
      })
      .andWhere('role.module = :module', {
        module: SystemModule.EMONC,
      })
      .andWhere('role.isActive = :roleActive', {
        roleActive: true,
      })
      .andWhere('roleAssignment.revokedAt IS NULL')
      .andWhere(
        '(roleAssignment.expiresAt IS NULL OR roleAssignment.expiresAt > :now)',
        { now },
      )
      .andWhere('roleAssignment.assignedAt <= :now')
      .andWhere('user.deletedAt IS NULL')
      .distinct(true);
  }

  /**
   * 1. Get all mentees with filtering and pagination.
   */
  async findAll(query: {
    search?: string;
    status?: AccountStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number(query.limit) || 20),
    );

    const queryBuilder = this.createMenteeQuery();

    if (query.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: query.status,
      });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.firstName LIKE :search', { search })
            .orWhere('user.lastName LIKE :search', { search })
            .orWhere('user.email LIKE :search', { search })
            .orWhere('user.phoneNumber LIKE :search', { search });
        }),
      );
    }

    queryBuilder
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [mentees, total] =
      await queryBuilder.getManyAndCount();

    return {
      data: mentees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 2. Get one mentee by ID.
   */
  async findOne(id: string) {
    const mentee = await this.createMenteeQuery()
      .andWhere('user.id = :id', { id })
      .getOne();

    if (!mentee) {
      throw new NotFoundException(
        `Mentee with ID ${id} not found`,
      );
    }

    return mentee;
  }

  /**
   * 3. Get eligible active mentees.
   */
  async findEligible() {
    return this.createMenteeQuery()
      .andWhere('user.status = :status', {
        status: AccountStatus.ACTIVE,
      })
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();
  }

  /**
   * 4. Get mentee statistics.
   */
  async getStatistics() {
    const results = await this.createMenteeQuery()
      .select('user.status', 'status')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .groupBy('user.status')
      .getRawMany();

    const statistics = {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      deactivated: 0,
    };

    for (const result of results) {
      const count = Number(result.count);

      statistics.total += count;

      switch (result.status) {
        case AccountStatus.ACTIVE:
          statistics.active = count;
          break;

        case AccountStatus.INACTIVE:
          statistics.inactive = count;
          break;

        case AccountStatus.PENDING:
          statistics.pending = count;
          break;

        case AccountStatus.DEACTIVATED:
          statistics.deactivated = count;
          break;
      }
    }

    return statistics;
  }

  /**
   * 5. Get the logged-in mentee's personal dashboard.
   */
  async getMyDashboard(userId: string) {
    const mentee = await this.createMenteeQuery()
      .andWhere('user.id = :userId', { userId })
      .andWhere('user.status = :status', {
        status: AccountStatus.ACTIVE,
      })
      .getOne();

    if (!mentee) {
      throw new NotFoundException(
        'Active mentee account not found',
      );
    }

    const organization =
      mentee.organizationAssignments?.[0];

    return {
      message: 'Mentee dashboard retrieved successfully',

      profile: {
        id: mentee.id,
        firstName: mentee.firstName,
        lastName: mentee.lastName,
        fullName: `${mentee.firstName} ${mentee.lastName}`,
        email: mentee.email,
        phoneNumber: mentee.phoneNumber,
        level: organization?.level,
        facilityId: organization?.facilityId,
        level: mentee.organizationAssignments,
        status: mentee.status,
        cadreId: mentee.cadreId,
        joinedAt: mentee.createdAt,
      },

      cohort: null,
      mentor: null,

      learningSummary: {
        totalModules: 0,
        completedModules: 0,
        inProgressModules: 0,
        overallProgress: 0,
      },

      modules: [],
      upcomingSessions: [],

      assessments: {
        pending: [],
        completed: [],
      },
    };
  }
}
