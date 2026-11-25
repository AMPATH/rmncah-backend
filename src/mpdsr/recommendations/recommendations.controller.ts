import {
  Body,
  Controller,
  Get,
  Headers,
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

import { CreateCaseRecommendationDto } from './dto/create-case-recommendation.dto.js';
import { RecommendationsService } from './recommendations.service.js';

@Controller('recommendations')
@UseGuards(PermissionsGuard)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Post('cases/:caseId')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.recommendations.create')
  create(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() dto: CreateCaseRecommendationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.recommendationsService.create(
      caseId,
      dto,
      user.id,
      assignmentId,
    );
  }

  @Get('cases/:caseId')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.recommendations.read')
  findAll(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.recommendationsService.findAll(
      caseId,
      user.id,
      assignmentId,
    );
  }
}
