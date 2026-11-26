import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RbacModule } from '../../shared/rbac/rbac.module.js';

import { UserOrganizationAssignment } from '../../shared/user-organization-assignments/entities/user-organization-assignment.entity.js';

import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';


import { CasesController } from './cases.controller.js';
import { CasesService } from './cases.service.js';

import { Icd11Cause } from '../causes-of-death/entities/icd11-cause.entity.js';
import { Icd11CauseType } from '../causes-of-death/entities/icd11-cause-type.entity.js';
import { ContributingFactor } from '../contributing-factors/entities/contributing-factor.entity.js';
import { Case } from './entities/case.entity.js';
import { CaseContributingFactor } from './entities/case-contributing-factor.entity.js';
import { CaseStatusHistory } from './entities/case-status-history.entity.js';
import { MaternalCaseDetail } from './entities/maternal-case-detail.entity.js';
import { NearMissDetail } from './entities/near-miss-detail.entity.js';
import { PerinatalCaseDetail } from './entities/perinatal-case-detail.entity.js';

@Module({
  imports: [
    RbacModule,
    TypeOrmModule.forFeature([
      Case,
      CaseContributingFactor,
      ContributingFactor,
      CaseStatusHistory,
      Icd11Cause,
      Icd11CauseType,
      MaternalCaseDetail,
      PerinatalCaseDetail,
      NearMissDetail,
      UserOrganizationAssignment,
      Facility,
      CommunityUnit,
      SubCounty,
    ]),
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
