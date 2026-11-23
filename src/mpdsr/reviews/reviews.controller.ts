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

import { CompleteCaseReviewSectionDto } from './dto/complete-case-review-section.dto.js';
import { ReviewCaseCauseDto } from './dto/review-case-cause.dto.js';
import { ReviewCaseContributingFactorDto } from './dto/review-case-contributing-factor.dto.js';
import { ReviewCaseRecommendationDto } from './dto/review-case-recommendation.dto.js';
import { ReviewsService } from './reviews.service.js';

@Controller('reviews')
@UseGuards(PermissionsGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('cases/:caseId')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.case_reviews.create')
  startReview(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.reviewsService.startReview(caseId, user.id, assignmentId);
  }

  @Get('cases/:caseId')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.case_reviews.read')
  findOne(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.reviewsService.findOne(caseId, user.id, assignmentId);
  }

  @Post('cases/:caseId/review-contributing-factor')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.case_reviews.update')
  reviewContributingFactor(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() dto: ReviewCaseContributingFactorDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.reviewsService.reviewContributingFactor(
      caseId,
      dto,
      user.id,
      assignmentId,
    );
  }

  @Post('cases/:caseId/review-recommendation')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.case_reviews.update')
  reviewRecommendation(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() dto: ReviewCaseRecommendationDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.reviewsService.reviewRecommendation(
      caseId,
      dto,
      user.id,
      assignmentId,
    );
  }

  @Post('cases/:caseId/review-cause')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.case_reviews.update')
  reviewCause(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() dto: ReviewCaseCauseDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.reviewsService.reviewCause(
      caseId,
      dto,
      user.id,
      assignmentId,
    );
  }

  // The Chair explicitly completes each section after reviewing its contents.
  @Post('cases/:caseId/complete-section')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.case_reviews.update')
  completeSection(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body() dto: CompleteCaseReviewSectionDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.reviewsService.completeSection(
      caseId,
      dto.section,
      user.id,
      assignmentId,
    );
  }

  @Post('cases/:caseId/finalize')
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.case_reviews.finalize')
  finalize(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-assignment-id') assignmentId: string,
  ) {
    return this.reviewsService.finalize(caseId, user.id, assignmentId);
  }
}
