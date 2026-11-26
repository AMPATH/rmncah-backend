import { Module } from '@nestjs/common';

import { CasesModule } from './cases/cases.module.js';
import { Icd11CausesModule } from './causes-of-death/icd11-causes.module.js';

import { RbacModule } from '../shared/rbac/rbac.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { ContributingFactorsModule } from './contributing-factors/contributing-factors.module.js';
import { RecommendationsModule } from './recommendations/recommendations.module.js';
import { RecommendationAssignmentsModule } from './recommendation-assignments/recommendation-assignments.module.js';

@Module({
  imports: [
    CasesModule,
    Icd11CausesModule,
    RbacModule,
    ReviewsModule,
    ContributingFactorsModule,
    RecommendationsModule,
    RecommendationAssignmentsModule,
  ],
})
export class MpdsrModule {}
