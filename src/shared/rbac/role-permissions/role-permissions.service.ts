import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { RolePermission } from './entities/role-permission.entity.js';
import { Role } from '../roles/entities/role.entity.js';
import { Permission } from '../permissions/entities/permission.entity.js';

import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';

@Injectable()
export class RolePermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Retrieve all permissions assigned to a role.
   */
  async findRolePermissions(roleId: string): Promise<RolePermission[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return this.rolePermissionRepository.find({
      where: { roleId },
      relations: { permission: true },
    });
  }

  /**
   * Assign permissions to a role.
   *
   * A role can only receive permissions belonging to its module.
   * Existing assignments are preserved and duplicates are ignored.
   */
  async assignPermissions(
    roleId: string,
    dto: AssignPermissionsDto,
  ): Promise<RolePermission[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    // Remove duplicate IDs supplied in the request.
    const permissionIds = [...new Set(dto.permissionIds)];

    if (permissionIds.length === 0) {
      throw new BadRequestException(
        'At least one permission must be supplied.',
      );
    }

    // Retrieve all requested permissions.
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    // Ensure every requested permission exists.
    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions were not found.');
    }

    // Prevent assigning permissions from another module.
    const incompatiblePermissions = permissions.filter(
      (permission) => permission.module !== role.module,
    );

    if (incompatiblePermissions.length > 0) {
      throw new BadRequestException(
        `Role "${role.code}" belongs to the ${role.module} module and cannot receive permissions from another module.`,
      );
    }

    // Find assignments that already exist.
    const existingAssignments = await this.rolePermissionRepository.find({
      where: {
        roleId,
        permissionId: In(permissionIds),
      },
    });

    const existingPermissionIds = new Set(
      existingAssignments.map((assignment) => assignment.permissionId),
    );

    // Create only missing assignments.
    const newAssignments = permissionIds
      .filter((permissionId) => !existingPermissionIds.has(permissionId))
      .map((permissionId) =>
        this.rolePermissionRepository.create({
          roleId,
          permissionId,
        }),
      );

    if (newAssignments.length > 0) {
      await this.rolePermissionRepository.save(newAssignments);
    }

    return this.findRolePermissions(roleId);
  }

  /**
   * Remove a permission assignment without deleting
   * the permission or role itself.
   */
  async removePermission(roleId: string, permissionId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    const result = await this.rolePermissionRepository.delete({
      roleId,
      permissionId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        'Permission assignment not found for this role.',
      );
    }
  }
}
