
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { TrainingSessionsService } from './training-sessions.service.js';

import { CreateTrainingSessionDto } from './dto/create-training-session.dto.js';
import { UpdateTrainingSessionDto } from './dto/update-training-session.dto.js';
import { UpdateTrainingSessionStatusDto } from './dto/update-training-session-status.dto.js';

import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../../shared/rbac/roles/guards/roles.guard.js';
import { Roles } from '../../../../shared/rbac/roles/decorators/roles.decorator.js';

import { SystemModule } from '../../../../shared/rbac/enum/system-module.enum.js';
import { EmoncRole } from '../../../../shared/enums/emonc-role.enum.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('emonc/training-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemModule.EMONC,
  EmoncRole.MENTOR,
)
export class TrainingSessionsController {
  constructor(
    private readonly trainingSessionsService: TrainingSessionsService,
  ) {}

  // Schedule a session under a cohort-module assignment.
  @Post('assignments/:assignmentId')
  create(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: CreateTrainingSessionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.trainingSessionsService.create(
      assignmentId,
      dto,
      request.user.userId,
    );
  }

  // View all sessions under a cohort-module assignment.
  @Get('assignments/:assignmentId')
  findByAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.trainingSessionsService.findByAssignment(
      assignmentId,
      request.user.userId,
    );
  }

  // View one training session.
  @Get(':sessionId')
  findOne(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.trainingSessionsService.findOne(
      sessionId,
      request.user.userId,
    );
  }

  // Update session details or schedule.
  @Patch(':sessionId')
  update(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdateTrainingSessionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.trainingSessionsService.update(
      sessionId,
      dto,
      request.user.userId,
    );
  }

  // Update session status.
  @Patch(':sessionId/status')
  updateStatus(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdateTrainingSessionStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.trainingSessionsService.updateStatus(
      sessionId,
      dto,
      request.user.userId,
    );
  }

  // Delete a training session.
  @Delete(':sessionId')
  remove(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.trainingSessionsService.remove(
      sessionId,
      request.user.userId,
    );
  }
}
