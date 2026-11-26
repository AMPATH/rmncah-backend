
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ModuleSectionsService } from './module-sections.service.js';
import { ModuleSectionsController } from './module-sections.controller.js';

import { ModuleSection } from './entities/module-section.entity.js';
import { TrainingModule } from '../training-modules/entities/training-module.entity.js';

import { RolesGuard } from '../../../shared/rbac/roles/guards/roles.guard.js';
import { UserRoleAssignment } from '../../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleSection,
      TrainingModule,
      UserRoleAssignment,
    ]),
  ],
  controllers: [ModuleSectionsController],
  providers: [
    ModuleSectionsService,
    RolesGuard,
  ],
})
export class ModuleSectionsModule {}
