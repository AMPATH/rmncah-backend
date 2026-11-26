import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ApiStandardSuccessResponse } from '../../common/decorators/api-success-response.decorator.js';

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
import { RecommendationAssignmentResponseDto } from './dto/responses/recommendation-assignment-response.dto.js';
import { RecommendationAssignmentHistoryResponseDto } from './dto/responses/recommendation-assignment-history-response.dto.js';
import { DeclineRecommendationAssignmentDto } from './dto/decline-recommendation-assignment.dto.js';
import { ReassignRecommendationAssignmentDto } from './dto/reassign-recommendation-assignment.dto.js';
import { RecommendationAssignmentsService } from './recommendation-assignments.service.js';

@Controller('recommendations')
@ApiTags('MPDSR - Recommendation Assignments')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
export class RecommendationAssignmentsController {
  constructor(
    private readonly recommendationAssignmentsService: RecommendationAssignmentsService,
  ) {}

  @ApiOperation({ summary: 'Reassign a recommendation assignment' })
  @ApiStandardSuccessResponse(RecommendationAssignmentResponseDto, {
    description: 'Recommendation assignment reassigned successfully.',
    status: 201,
  })
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

  @ApiOperation({ summary: 'Accept a recommendation assignment' })
  @ApiStandardSuccessResponse(RecommendationAssignmentResponseDto, {
    description: 'Recommendation assignment accepted successfully.',
    status: 201,
  })
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

  @ApiOperation({ summary: 'Decline a recommendation assignment' })
  @ApiStandardSuccessResponse(RecommendationAssignmentResponseDto, {
    description: 'Recommendation assignment declined successfully.',
    status: 201,
  })
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

  @ApiOperation({ summary: 'Retrieve recommendation assignment history' })
  @ApiStandardSuccessResponse(RecommendationAssignmentHistoryResponseDto, {
    description:
      'Recommendation details and their assignment history retrieved successfully.',
  })
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

  @ApiOperation({ summary: 'Create the initial recommendation assignment' })
  @ApiStandardSuccessResponse(RecommendationAssignmentResponseDto, {
    description: 'Initial recommendation assignment created successfully.',
    status: 201,
  })
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
