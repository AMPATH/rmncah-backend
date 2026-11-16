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

import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

import { RequirePermissions } from '../rbac/authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../rbac/authorization/guards/permissions.guard.js';
import { SystemModule } from '../rbac/enum/system-module.enum.js';

import { CreateUserOrganizationAssignmentDto } from './dto/create-user-organization-assignment.dto.js';
import { UserOrganizationAssignmentsService } from './user-organization-assignments.service.js';

@Controller('user-organization-assignments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserOrganizationAssignmentsController {
  constructor(
    private readonly assignmentsService: UserOrganizationAssignmentsService,
  ) {}

  // Create an organization assignment.
  @Post()
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.create',
  )
  create(
    @Body() dto: CreateUserOrganizationAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignmentsService.create(dto, user.id);
  }

  // Retrieve all organization assignments.
  @Get()
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.read',
  )
  findAll() {
    return this.assignmentsService.findAll();
  }

  // Retrieve assignments belonging to a specific user.
  @Get('user/:userId')
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.read',
  )
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.assignmentsService.findByUser(userId);
  }

  // Retrieve one organization assignment.
  @Get(':id')
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.read',
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.findOne(id);
  }

  // End an existing organization assignment.
  @Patch(':id/end')
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.revoke',
  )
  end(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.end(id);
  }
}
