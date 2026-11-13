import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
import { UserOrganizationAssignment } from '../../user-organization-assignments/entities/user-organization-assignment.entity.js';
import { OrganizationLevel } from '../../user-organization-assignments/enum/organization-level.enum.js';

import { Role } from '../roles/entities/role.entity.js';
import { SystemModule } from '../enum/system-module.enum.js';

import { UserRoleAssignment } from './entities/user-role-assignment.entity.js';
import { CreateUserRoleAssignmentDto } from './dto/create-user-role-assignment.dto.js';

interface RoleRule {
  module: SystemModule;
  organizationLevel: OrganizationLevel | null;
}

/**
 * Defines the organizational scope required by each system role.
 *
 * A null organizationLevel means the role is system-wide.
 */
const ROLE_RULES: Record<string, RoleRule> = {
  SYSTEM_ADMIN: {
    module: SystemModule.PLATFORM,
    organizationLevel: null,
  },

  CHP: {
    module: SystemModule.MPDSR,
    organizationLevel: OrganizationLevel.COMMUNITY,
  },

  FACILITY_REPORTER: {
    module: SystemModule.MPDSR,
    organizationLevel: OrganizationLevel.FACILITY,
  },

  FACILITY_CHAIR: {
    module: SystemModule.MPDSR,
    organizationLevel: OrganizationLevel.FACILITY,
  },

  FACILITY_IN_CHARGE: {
    module: SystemModule.MPDSR,
    organizationLevel: OrganizationLevel.FACILITY,
  },

  PCN_COORDINATOR: {
    module: SystemModule.MPDSR,
    organizationLevel: OrganizationLevel.PCN,
  },

  SUBCOUNTY_COORDINATOR: {
    module: SystemModule.MPDSR,
    organizationLevel: OrganizationLevel.SUB_COUNTY,
  },

  COUNTY_SURVEILLANCE_LEAD: {
    module: SystemModule.MPDSR,
    organizationLevel: OrganizationLevel.COUNTY,
  },

  PROGRAM_LEAD: {
    module: SystemModule.EMONC,
    organizationLevel: OrganizationLevel.COUNTY,
  },

  COUNTY_MENTOR_RH: {
    module: SystemModule.EMONC,
    organizationLevel: OrganizationLevel.COUNTY,
  },

  MENTOR: {
    module: SystemModule.EMONC,
    organizationLevel: OrganizationLevel.FACILITY,
  },

  MENTEE: {
    module: SystemModule.EMONC,
    organizationLevel: OrganizationLevel.FACILITY,
  },
};

@Injectable()
export class UserRoleAssignmentsService {
  constructor(
    @InjectRepository(UserRoleAssignment)
    private readonly assignmentRepository: Repository<UserRoleAssignment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(UserOrganizationAssignment)
    private readonly organizationAssignmentRepository: Repository<UserOrganizationAssignment>,
  ) {}

  /**
   * Assign a role after validating the user, role and organizational scope.
   */
  async assignRole(
    dto: CreateUserRoleAssignmentDto,
    assignedBy: string,
  ): Promise<UserRoleAssignment> {
    const now = new Date();

    // Prevent users from assigning roles to themselves.
    if (dto.userId === assignedBy) {
      throw new BadRequestException('Users cannot assign roles to themselves');
    }

    // Confirm that the target user exists.
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Confirm that the role exists.
    const role = await this.roleRepository.findOne({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (!role.isActive) {
      throw new BadRequestException('Cannot assign an inactive role');
    }

    // Every supported role must have a defined module and scope.
    const roleRule = ROLE_RULES[role.code];

    if (!roleRule) {
      throw new BadRequestException(
        `No organizational scope rule is configured for role ${role.code}`,
      );
    }

    // Prevent a role from being assigned under the wrong module.
    if (role.module !== roleRule.module) {
      throw new BadRequestException(
        `Role ${role.code} must belong to the ${roleRule.module} module`,
      );
    }

    let organizationAssignment: UserOrganizationAssignment | null = null;

    // System-wide roles must not have an organizational assignment.
    if (roleRule.organizationLevel === null) {
      if (dto.organizationAssignmentId) {
        throw new BadRequestException(
          'This role does not require an organizational assignment',
        );
      }
    } else {
      // Operational roles must have an organizational assignment.
      if (!dto.organizationAssignmentId) {
        throw new BadRequestException(
          `Role ${role.code} requires an organizational assignment`,
        );
      }

      organizationAssignment =
        await this.organizationAssignmentRepository.findOne({
          where: {
            id: dto.organizationAssignmentId,
          },
        });

      if (!organizationAssignment) {
        throw new NotFoundException('Organizational assignment not found');
      }

      // The organizational assignment must belong to the target user.
      if (organizationAssignment.userId !== dto.userId) {
        throw new BadRequestException(
          'The organizational assignment does not belong to this user',
        );
      }

      // The assignment level must match the role's required level.
      if (organizationAssignment.level !== roleRule.organizationLevel) {
        throw new BadRequestException(
          `Role ${role.code} requires an organization level of ${roleRule.organizationLevel}`,
        );
      }

      // An ended organizational assignment cannot receive a role.
      if (organizationAssignment.endDate !== null) {
        throw new BadRequestException(
          'Cannot assign a role to an ended organizational assignment',
        );
      }

      // A future organizational assignment is not active yet.
      if (organizationAssignment.startDate > now) {
        throw new BadRequestException(
          'Cannot assign a role to an organizational assignment that has not started',
        );
      }
    }

    // Validate the optional role expiry date.
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
      throw new BadRequestException('The expiry date must be in the future');
    }

    // Prevent duplicate active assignments in the same scope.
    const duplicateQuery = this.assignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.userId = :userId', {
        userId: dto.userId,
      })
      .andWhere('assignment.roleId = :roleId', {
        roleId: dto.roleId,
      })
      .andWhere('assignment.revokedAt IS NULL')
      .andWhere(
        '(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)',
        { now },
      );

    if (dto.organizationAssignmentId) {
      duplicateQuery.andWhere(
        'assignment.organizationAssignmentId = :organizationAssignmentId',
        {
          organizationAssignmentId: dto.organizationAssignmentId,
        },
      );
    } else {
      duplicateQuery.andWhere('assignment.organizationAssignmentId IS NULL');
    }

    const existingAssignment = await duplicateQuery.getOne();

    if (existingAssignment) {
      throw new ConflictException(
        'The user already has this active role in this organizational scope',
      );
    }

    // Create the role assignment and preserve its assignment history.
    const assignment = this.assignmentRepository.create({
      userId: dto.userId,
      roleId: dto.roleId,
      organizationAssignmentId: dto.organizationAssignmentId ?? null,
      organizationAssignment,
      assignedBy,
      assignedAt: now,
      expiresAt,
    });

    return this.assignmentRepository.save(assignment);
  }

  /**
   * Retrieve all role assignments.
   */
  async findAll(): Promise<UserRoleAssignment[]> {
    return this.assignmentRepository.find({
      relations: {
        user: true,
        role: true,
        organizationAssignment: true,
      },
      order: {
        assignedAt: 'DESC',
      },
    });
  }

  /**
   * Retrieve one role assignment by its ID.
   */
  async findOne(id: string): Promise<UserRoleAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: {
        user: true,
        role: true,
        organizationAssignment: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Role assignment not found');
    }

    return assignment;
  }

  /**
   * Retrieve all role assignments belonging to a user.
   */
  async findUserAssignments(userId: string): Promise<UserRoleAssignment[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.assignmentRepository.find({
      where: { userId },
      relations: {
        role: true,
        organizationAssignment: true,
      },
      order: {
        assignedAt: 'DESC',
      },
    });
  }

  /**
   * Revoke a role assignment without deleting its history.
   */
  async revokeRole(id: string, revokedBy: string): Promise<UserRoleAssignment> {
    const assignment = await this.findOne(id);

    if (assignment.revokedAt) {
      throw new ConflictException(
        'This role assignment has already been revoked',
      );
    }

    assignment.revokedAt = new Date();
    assignment.revokedBy = revokedBy;

    return this.assignmentRepository.save(assignment);
  }
}
