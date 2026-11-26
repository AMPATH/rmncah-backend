import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  Body,
  Controller,
  Get,
  Headers,
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

@ApiTags('Platform - Organization Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserOrganizationAssignmentsController {
  constructor(
    private readonly assignmentsService: UserOrganizationAssignmentsService,
  ) {}

  // Create an organization assignment.
  @ApiOperation({ summary: 'Create an organization assignment' })
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

  // Program Lead: create a facility assignment within their own county.
  @ApiOperation({
    summary: 'Create an EmONC facility assignment within the Program Lead county',
  })
  @ApiHeader({
    name: 'x-organization-assignment-id',
    required: true,
    description: 'UUID of the Program Lead\'s active county organizational assignment.',
  })
  @Post('emonc')
  @RequirePermissions(
    SystemModule.EMONC,
    'emonc.users.create_mentor_mentee',
  )
  createForProgramLead(
    @Body() dto: CreateUserOrganizationAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') organizationAssignmentId: string,
  ) {
    return this.assignmentsService.createForProgramLead(
      dto,
      user.id,
      organizationAssignmentId,
    );
  }

  // Retrieve all organization assignments.
  @ApiOperation({ summary: 'Retrieve all organization assignments' })
  @Get()
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.read',
  )
  findAll() {
    return this.assignmentsService.findAll();
  }

  // Retrieve assignments belonging to a specific user.
  @ApiOperation({ summary: 'Retrieve assignments for a specific user' })
  @Get('user/:userId')
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.read',
  )
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.assignmentsService.findByUser(userId);
  }

  // Retrieve one organization assignment.
  @ApiOperation({ summary: 'Retrieve a specific organization assignment' })
  @Get(':id')
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.read',
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.findOne(id);
  }

  // End an existing organization assignment.
  @ApiOperation({ summary: 'End an organization assignment' })
  @Patch(':id/end')
  @RequirePermissions(
    SystemModule.PLATFORM,
    'platform.organization_assignments.revoke',
  )
  end(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.end(id);
  }
}
