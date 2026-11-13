import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../auth/interfaces/authenticated-user.interface.js';

import { CreateUserRoleAssignmentDto } from './dto/create-user-role-assignment.dto.js';
import { UserRoleAssignmentsService } from './user-role-assignments.service.js';

import { SystemModule } from '../enum/system-module.enum.js';
import { RequirePermissions } from '../authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../authorization/guards/permissions.guard.js';

@Controller('user-role-assignments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserRoleAssignmentsController {
  constructor(
    private readonly userRoleAssignmentsService: UserRoleAssignmentsService,
  ) {}

  /**
   * Assign a role to a user.
   */
  @Post()
  @RequirePermissions(SystemModule.PLATFORM, 'platform.roles.assign')
  async assignRole(
    @Body() dto: CreateUserRoleAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userRoleAssignmentsService.assignRole(dto, user.id);
  }

  /**
   * Retrieve all role assignments.
   */
  @Get()
  @RequirePermissions(SystemModule.PLATFORM, 'platform.roles.read')
  async findAll() {
    return this.userRoleAssignmentsService.findAll();
  }

  /**
   * Retrieve role assignments belonging to a specific user.
   */
  @Get('user/:userId')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.roles.read')
  async findUserAssignments(
    @Param('userId', new ParseUUIDPipe({ version: '4' }))
    userId: string,
  ) {
    return this.userRoleAssignmentsService.findUserAssignments(userId);
  }

  /**
   * Retrieve one role assignment.
   */
  @Get(':id')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.roles.read')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.userRoleAssignmentsService.findOne(id);
  }

  /**
   * Revoke an existing role assignment.
   */
  @Patch(':id/revoke')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.roles.assign')
  async revokeRole(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userRoleAssignmentsService.revokeRole(id, user.id);
  }
}
