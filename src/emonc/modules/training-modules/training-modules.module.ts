import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TrainingModule } from './entities/training-module.entity.js';

import { TrainingModulesService } from './training-modules.service.js';
import { TrainingModulesController } from './training-modules.controller.js';
import { UserRoleAssignment } from '../../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';
import { ModuleSection } from '../module-sections/entities/module-section.entity.js';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingModule,
      ModuleSection,
      UserRoleAssignment,
    ]),
  ],
  controllers: [TrainingModulesController],
  providers: [
    TrainingModulesService,
    RolesGuard,
  ],
  exports: [TrainingModulesService],
})
export class TrainingModulesModule {}