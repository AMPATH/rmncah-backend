import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { AuthorizationModule } from '../authorization/authorization.module.js';

import { RolePermission } from './entities/role-permission.entity.js';
import { Role } from '../roles/entities/role.entity.js';
import { Permission } from '../permissions/entities/permission.entity.js';

import { RolePermissionsController } from './role-permissions.controller.js';
import { RolePermissionsService } from './role-permissions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RolePermission, Role, Permission]),
    AuthorizationModule,
  ],
  controllers: [RolePermissionsController],
  providers: [RolePermissionsService, JwtAuthGuard],
  exports: [RolePermissionsService],
})
export class RolePermissionsModule {}
