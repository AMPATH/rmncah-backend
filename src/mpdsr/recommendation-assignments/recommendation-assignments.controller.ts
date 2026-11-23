import {
  Body,
  Controller,
  Headers,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface.js';
import { RequirePermissions } from '../../shared/rbac/authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../../shared/rbac/authorization/guards/permissions.guard.js';
import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';

import { CreateRecommendationAssignmentDto } from './dto/create-recommendation-assignment.dto.js';
import { DeclineRecommendationAssignmentDto } from './dto/decline-recommendation-assignment.dto.js';
import { ReassignRecommendationAssignmentDto } from './dto/reassign-recommendation-assignment.dto.js';
import { RecommendationAssignmentsService } from './recommendation-assignments.service.js';

@Controller('recommendations')
@UseGuards(PermissionsGuard)
export class RecommendationAssignmentsController {
  constructor(
    private readonly recommendationAssignmentsService: RecommendationAssignmentsService,
  ) {}

  @Post('assignments/:assignmentId/reassign')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.recommendations.reassign')
  reassignAssignment(
    @Param('assignmentId', new ParseUUIDPipe()) assignmentId: string,
    @Body() dto: ReassignRecommendationAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') organizationAssignmentId: string,
  ) {
    return this.recommendationAssignmentsService.reassignAssignment(
      assignmentId,
      dto,
      user.id,
      organizationAssignmentId,
    );
  }

  @Post('assignments/:assignmentId/accept')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.recommendations.accept')
  acceptAssignment(
    @Param('assignmentId', new ParseUUIDPipe()) assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') organizationAssignmentId: string,
  ) {
    return this.recommendationAssignmentsService.acceptAssignment(
      assignmentId,
      user.id,
      organizationAssignmentId,
    );
  }

  @Post('assignments/:assignmentId/decline')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.recommendations.accept')
  declineAssignment(
    @Param('assignmentId', new ParseUUIDPipe()) assignmentId: string,
    @Body() dto: DeclineRecommendationAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') organizationAssignmentId: string,
  ) {
    return this.recommendationAssignmentsService.declineAssignment(
      assignmentId,
      dto.reason,
      user.id,
      organizationAssignmentId,
    );
  }

  @Get(':recommendationId/assignments')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.recommendations.read')
  getAssignmentHistory(
    @Param('recommendationId', new ParseUUIDPipe())
    recommendationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.recommendationAssignmentsService.findAssignmentHistory(
      recommendationId,
      user.id,
      assignmentId,
    );
  }

  @Post(':recommendationId/assignments')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.recommendations.assign')
  createInitialAssignment(
    @Param('recommendationId', new ParseUUIDPipe())
    recommendationId: string,
    @Body() dto: CreateRecommendationAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.recommendationAssignmentsService.createInitialAssignment(
      recommendationId,
      dto,
      user.id,
      assignmentId,
    );
  }
}
