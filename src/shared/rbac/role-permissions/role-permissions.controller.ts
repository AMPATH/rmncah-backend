import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { SystemModule } from '../enum/system-module.enum.js';
import { RequirePermissions } from '../authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../authorization/guards/permissions.guard.js';

import { AssignPermissionsDto } from './dto/assign-permissions.dto.js';
import { RolePermissionsService } from './role-permissions.service.js';

@Controller('roles/:roleId/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  // Retrieve permissions assigned to a role.
  @Get()
  @RequirePermissions(SystemModule.PLATFORM, 'platform.permissions.read')
  findRolePermissions(
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string,
  ) {
    return this.rolePermissionsService.findRolePermissions(roleId);
  }

  // Assign one or more permissions to a role.
  @Post()
  @RequirePermissions(SystemModule.PLATFORM, 'platform.permissions.manage')
  assignPermissions(
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolePermissionsService.assignPermissions(roleId, dto);
  }

  // Remove a permission from a role.
  @Delete(':permissionId')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.permissions.manage')
  removePermission(
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string,
    @Param('permissionId', new ParseUUIDPipe({ version: '4' }))
    permissionId: string,
  ) {
    return this.rolePermissionsService.removePermission(roleId, permissionId);
  }
}
