
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LearningMaterial } from './entities/learning-material.entity.js';
import { ModuleSection } from '../module-sections/entities/module-section.entity.js';

import { LearningMaterialsController } from './learning-materials.controller.js';
import { LearningMaterialsService } from './learning-materials.service.js';

import { UserRoleAssignment } from '../../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningMaterial,
      ModuleSection,
      UserRoleAssignment,
    ]),
  ],
  controllers: [LearningMaterialsController],
  providers: [
    LearningMaterialsService,
    RolesGuard,
  ],
  exports: [LearningMaterialsService],
})
export class LearningMaterialsModule {}
