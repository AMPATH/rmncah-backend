
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MentorsModule } from './mentors/mentors.module.js';
import { MenteesModule } from './mentees/mentees.module.js';
import { CohortsModule } from './cohorts/cohorts.module.js';
import { RbacModule } from '../shared/rbac/rbac.module.js';
import { ModulesModule } from './modules/modules.module.js';
import { UserRoleAssignment } from '../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { RolesGuard } from '../shared/rbac/roles/guards/roles.guard.js';
import { ProgressModule } from './progress/progress.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRoleAssignment]),
    MentorsModule,
    MenteesModule,
    CohortsModule,
    ProgressModule,
    RbacModule,
    ModulesModule,
  ],
 
    
  controllers: [],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class EmoncModule {}
