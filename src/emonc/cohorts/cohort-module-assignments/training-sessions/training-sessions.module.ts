
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CohortModuleAssignment } from '../entities/cohort-module-assignment.entity.js';

import { TrainingSessionsService } from './training-sessions.service.js';
import { TrainingSessionsController } from './training-sessions.controller.js';

import { Cohort } from '../../entities/cohort.entity.js';
import { User } from '../../../../shared/users/entities/user.entity.js';
import { UserRoleAssignment } from '../../../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';

import { RolesGuard } from '../../../../shared/rbac/roles/guards/roles.guard.js';
import { TrainingSession } from './entities/training-sessions.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingSession,
      CohortModuleAssignment,
      Cohort,
      User,
      UserRoleAssignment,
    ]),
  ],
  controllers: [TrainingSessionsController],
  providers: [TrainingSessionsService, RolesGuard],
  exports: [TrainingSessionsService],
})
export class TrainingSessionsModule {}
