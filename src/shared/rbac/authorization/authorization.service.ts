import { BadRequestException, Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permission } from '../permissions/entities/permission.entity.js';
import { SystemModule } from '../enum/system-module.enum.js';

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Retrieves all permissions granted to a user within a module
   * and a specific organizational assignment.
   *
   * PLATFORM roles are system-wide and have no organization assignment.
   * MPDSR and EMONC roles require an active organization assignment.
   */
  async getUserPermissions(
    userId: string,
    module: SystemModule,
    organizationAssignmentId?: string,
  ): Promise<Permission[]> {
    if (module === SystemModule.PLATFORM && organizationAssignmentId) {
      throw new BadRequestException(
        'Platform permissions cannot have an organizational assignment.',
      );
    }

    if (module !== SystemModule.PLATFORM && !organizationAssignmentId) {
      throw new BadRequestException(
        'An organizational assignment is required for module permissions.',
      );
    }

    const now = new Date();

    const query = this.permissionRepository
      .createQueryBuilder('permission')
      .innerJoin('permission.rolePermissions', 'rolePermission')
      .innerJoin('rolePermission.role', 'role')
      .innerJoin('role.userAssignments', 'assignment')
      .leftJoin('assignment.organizationAssignment', 'organizationAssignment')
      .where('assignment.userId = :userId', { userId })
      .andWhere('permission.module = :module', { module })
      .andWhere('role.module = :module', { module })
      .andWhere('role.isActive = :isActive', { isActive: true })
      .andWhere('assignment.revokedAt IS NULL')
      .andWhere(
        '(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)',
        { now },
      );

    if (module === SystemModule.PLATFORM) {
      query.andWhere('assignment.organizationAssignmentId IS NULL');
    } else {
      query
        .andWhere(
          'assignment.organizationAssignmentId = :organizationAssignmentId',
          { organizationAssignmentId },
        )
        .andWhere('organizationAssignment.userId = :userId', { userId })
        .andWhere('organizationAssignment.endDate IS NULL')
        .andWhere('organizationAssignment.startDate <= :now', { now });
    }

    return query.distinct(true).getMany();
  }

  /**
   * Checks whether a user has a particular permission.
   */
  async hasPermission(
    userId: string,
    permissionCode: string,
    module: SystemModule,
    organizationAssignmentId?: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(
      userId,
      module,
      organizationAssignmentId,
    );

    return permissions.some((permission) => permission.code === permissionCode);
  }

  /**
   * Checks whether a user has at least one supplied permission.
   */
  async hasAnyPermission(
    userId: string,
    permissionCodes: string[],
    module: SystemModule,
    organizationAssignmentId?: string,
  ): Promise<boolean> {
    if (permissionCodes.length === 0) {
      return false;
    }

    const permissions = await this.getUserPermissions(
      userId,
      module,
      organizationAssignmentId,
    );

    const userPermissionCodes = new Set(
      permissions.map((permission) => permission.code),
    );

    return permissionCodes.some((code) => userPermissionCodes.has(code));
  }

  /**
   * Checks whether a user has every supplied permission.
   */
  async hasAllPermissions(
    userId: string,
    permissionCodes: string[],
    module: SystemModule,
    organizationAssignmentId?: string,
  ): Promise<boolean> {
    if (permissionCodes.length === 0) {
      return false;
    }

    const permissions = await this.getUserPermissions(
      userId,
      module,
      organizationAssignmentId,
    );

    const userPermissionCodes = new Set(
      permissions.map((permission) => permission.code),
    );

    return permissionCodes.every((code) => userPermissionCodes.has(code));
  }
}
