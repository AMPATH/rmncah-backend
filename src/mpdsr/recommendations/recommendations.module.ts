import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RbacModule } from '../../shared/rbac/rbac.module.js';

import { CasesModule } from '../cases/cases.module.js';
import { CaseContributingFactor } from '../cases/entities/case-contributing-factor.entity.js';

import { CaseRecommendation } from './entities/case-recommendation.entity.js';
import { RecommendationsController } from './recommendations.controller.js';
import { RecommendationsService } from './recommendations.service.js';

@Module({
  imports: [
    RbacModule,
    CasesModule,
    TypeOrmModule.forFeature([
      CaseRecommendation,
      CaseContributingFactor,
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
