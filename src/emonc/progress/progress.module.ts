
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgressService } from './progress.service.js';
import { ProgressController } from './progress.controller.js';

import { Progress } from './entities/progress.entity.js';
import { SectionProgress } from './entities/section-progress.entity.js';
import { LearningMaterialProgress } from './entities/learning-material-progress.entity.js';
import { UserRoleAssignment } from '../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Progress,
      SectionProgress,
      LearningMaterialProgress,
      UserRoleAssignment
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
