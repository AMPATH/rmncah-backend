
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { CohortModuleAssignmentsService } from './cohort-module-assignments.service.js';
import { AssignModuleDto } from './dto/assign-module.dto.js';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';
import { Roles } from '../../../shared/rbac/roles/decorators/roles.decorator.js';

import { SystemModule } from '../../../shared/rbac/enum/system-module.enum.js';
import { EmoncRole } from '../../../shared/enums/emonc-role.enum.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('emonc/cohort-module-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  SystemModule.EMONC,
  EmoncRole.MENTOR,
  EmoncRole.COUNTY_MENTOR_RH,
)
export class CohortModuleAssignmentsController {
  constructor(
    private readonly cohortModuleAssignmentsService: CohortModuleAssignmentsService,
  ) {}

  @Post(':cohortId/modules')
  assignModule(
    @Param('cohortId', ParseUUIDPipe) cohortId: string,
    @Body() assignModuleDto: AssignModuleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cohortModuleAssignmentsService.assignModule(
      cohortId,
      assignModuleDto.trainingModuleId,
      request.user.userId,
    );
  }

  @Get(':cohortId/modules')
  findByCohort(
    @Param('cohortId', ParseUUIDPipe) cohortId: string,
  ) {
    return this.cohortModuleAssignmentsService.findByCohort(cohortId);
  }

  @Delete(':cohortId/modules/:assignmentId')
  removeAssignment(
    @Param('cohortId', ParseUUIDPipe) cohortId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.cohortModuleAssignmentsService.removeAssignment(
      cohortId,
      assignmentId,
    );
  }
}
