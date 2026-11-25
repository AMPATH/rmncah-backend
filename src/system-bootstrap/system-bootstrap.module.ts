import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { envValidationSchema } from '../config/env.validation.js';
import { getDatabaseConfig } from '../config/database.config.js';

import { User } from '../shared/users/entities/user.entity.js';
import { Role } from '../shared/rbac/roles/entities/role.entity.js';
import { UserRoleAssignment } from '../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { UserOrganizationAssignment } from '../shared/user-organization-assignments/entities/user-organization-assignment.entity.js';

import { County } from '../locations/counties/entities/county.entity.js';
import { SubCounty } from '../locations/sub-counties/entities/sub-county.entity.js';
import { PrimaryCareNetwork } from '../mpdsr/pcns/entities/primary-care-network.entity.js';
import { FacilityPcnMembership } from '../mpdsr/pcns/entities/facility-pcn-membership.entity.js';
import { Facility } from '../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../locations/community-units/entities/community-unit.entity.js';

import { Invitation } from '../shared/invitations/entities/invitation.entity.js';
import { PasswordService } from '../auth/password.service.js';

import { SystemBootstrap } from './entities/system-bootstrap.entity.js';
import { SystemBootstrapService } from './system-bootstrap.service.js';
import { Permission } from '../shared/rbac/permissions/entities/permission.entity.js';
import { RolePermission } from '../shared/rbac/role-permissions/entities/role-permission.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRoleAssignment,
      UserOrganizationAssignment,
      County,
      SubCounty,
      PrimaryCareNetwork,
      FacilityPcnMembership,
      Facility,
      CommunityUnit,
      Permission,
      RolePermission,
      UserRoleAssignment,
      Invitation,
      SystemBootstrap,
    ]),
  ],
  providers: [SystemBootstrapService, PasswordService],
  exports: [SystemBootstrapService],
})
export class SystemBootstrapModule {}
