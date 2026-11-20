import { Module } from '@nestjs/common';

import { CasesModule } from './cases/cases.module.js';
import { PcnsModule } from './pcns/pcns.module.js';
import { Icd11CausesModule } from './causes-of-death/icd11-causes.module.js';

import { RbacModule } from '../shared/rbac/rbac.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { ContributingFactorsModule } from './contributing-factors/contributing-factors.module.js';

@Module({
  imports: [
    CasesModule,
    PcnsModule,
    Icd11CausesModule,
    RbacModule,
    ReviewsModule,
    ContributingFactorsModule,
  ],
})
export class MpdsrModule {}
