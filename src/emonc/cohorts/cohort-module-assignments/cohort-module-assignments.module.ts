
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CohortModuleAssignment } from './entities/cohort-module-assignment.entity.js';

import { CohortModuleAssignmentsService } from './cohort-module-assignments.service.js';
import { CohortModuleAssignmentsController } from './cohort-module-assignments.controller.js';

import { Cohort } from '../entities/cohort.entity.js';
import { TrainingModule } from '../../modules/training-modules/entities/training-module.entity.js';
import { User } from '../../../shared/users/entities/user.entity.js';

import { UserRoleAssignment } from '../../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';
import { TrainingSessionsModule } from './training-sessions/training-sessions.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CohortModuleAssignment,
      Cohort,
      TrainingModule,
      User,
      UserRoleAssignment,
    ]),
    TrainingSessionsModule,
  ],
  controllers: [CohortModuleAssignmentsController],
  providers: [
    CohortModuleAssignmentsService,
    RolesGuard,
  ],
  exports: [CohortModuleAssignmentsService],
})
export class CohortModuleAssignmentsModule {}
