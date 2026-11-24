import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RbacModule } from '../../shared/rbac/rbac.module.js';
import { CasesModule } from '../cases/cases.module.js';
import { Case } from '../cases/entities/case.entity.js';
import { CaseStatusHistory } from '../cases/entities/case-status-history.entity.js';
import { CaseContributingFactor } from '../cases/entities/case-contributing-factor.entity.js';
import { MaternalCaseDetail } from '../cases/entities/maternal-case-detail.entity.js';
import { PerinatalCaseDetail } from '../cases/entities/perinatal-case-detail.entity.js';
import { CaseRecommendation } from '../recommendations/entities/case-recommendation.entity.js';
import { CaseReview } from './entities/case-review.entity.js';
import { CaseReviewChange } from './entities/case-review-change.entity.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
  imports: [
    RbacModule,
    CasesModule,
    TypeOrmModule.forFeature([
      CaseReview,
      CaseReviewChange,
      Case,
      CaseStatusHistory,
      CaseContributingFactor,
      MaternalCaseDetail,
      PerinatalCaseDetail,
      CaseRecommendation,
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
