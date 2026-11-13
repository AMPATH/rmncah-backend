import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

import { County } from '../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';
import { PrimaryCareNetwork } from '../../mpdsr/pcns/entities/primary-care-network.entity.js';
import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';

import { AuthorizationModule } from '../rbac/authorization/authorization.module.js';
import { User } from '../users/entities/user.entity.js';

import { UserOrganizationAssignment } from './entities/user-organization-assignment.entity.js';
import { UserOrganizationAssignmentsController } from './user-organization-assignments.controller.js';
import { UserOrganizationAssignmentsService } from './user-organization-assignments.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrganizationAssignment,
      User,
      County,
      SubCounty,
      PrimaryCareNetwork,
      Facility,
      CommunityUnit,
    ]),
    AuthorizationModule,
  ],
  controllers: [UserOrganizationAssignmentsController],
  providers: [UserOrganizationAssignmentsService, JwtAuthGuard],
  exports: [UserOrganizationAssignmentsService],
})
export class UserOrganizationAssignmentsModule {}
