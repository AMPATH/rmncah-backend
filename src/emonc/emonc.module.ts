
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MentorsModule } from './mentors/mentors.module.js';
import { MenteesModule } from './mentees/mentees.module.js';
import { CohortsModule } from './cohorts/cohorts.module.js';
import { ModulesModule } from './modules/modules.module.js';


import { UserRoleAssignment } from '../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { RolesGuard } from '../shared/rbac/roles/guards/roles.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRoleAssignment]),
    MentorsModule,
    MenteesModule,
    CohortsModule,
    ModulesModule,
  ],
  controllers: [],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class EmoncModule {}
