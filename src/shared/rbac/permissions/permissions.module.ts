import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { AuthorizationModule } from '../authorization/authorization.module.js';

import { Permission } from './entities/permission.entity.js';
import { PermissionsController } from './permissions.controller.js';
import { PermissionsService } from './permissions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), AuthorizationModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, JwtAuthGuard],
  exports: [PermissionsService],
})
export class PermissionsModule {}
