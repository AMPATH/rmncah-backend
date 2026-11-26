import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CasesModule } from '../cases/cases.module.js';

import { CaseRecommendation } from '../recommendations/entities/case-recommendation.entity.js';
import { CaseRecommendationAssignment } from './entities/case-recommendation-assignment.entity.js';

import { User } from '../../shared/users/entities/user.entity.js';
import { UserOrganizationAssignment } from '../../shared/user-organization-assignments/entities/user-organization-assignment.entity.js';

import { County } from '../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';
import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';

import { RecommendationAssignmentsController } from './recommendation-assignments.controller.js';
import { RecommendationAssignmentsService } from './recommendation-assignments.service.js';
import { RbacModule } from '../../shared/rbac/rbac.module.js';

@Module({
  imports: [
    CasesModule,
    RbacModule,
    TypeOrmModule.forFeature([
      CaseRecommendation,
      CaseRecommendationAssignment,
      User,
      UserOrganizationAssignment,
      County,
      SubCounty,
      Facility,
      CommunityUnit,
    ]),
  ],
  controllers: [RecommendationAssignmentsController],
  providers: [RecommendationAssignmentsService],
  exports: [RecommendationAssignmentsService],
})
export class RecommendationAssignmentsModule {}
