import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Permission } from '../permissions/entities/permission.entity.js';
import { AuthorizationService } from './authorization.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';

@Module({
  // Register the Permission repository for AuthorizationService.
  imports: [TypeOrmModule.forFeature([Permission])],

  // Register the service and guard used for authorization.
  providers: [AuthorizationService, PermissionsGuard],

  // Make them available to other modules, including MPDSR and EMONC.
  exports: [AuthorizationService, PermissionsGuard],
})
export class AuthorizationModule {}
