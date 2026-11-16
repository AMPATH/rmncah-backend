import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { AuthorizationModule } from '../authorization/authorization.module.js';

import { Role } from './entities/role.entity.js';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Role]), AuthorizationModule],
  controllers: [RolesController],
  providers: [RolesService, JwtAuthGuard],
  exports: [RolesService],
})
export class RolesModule {}
