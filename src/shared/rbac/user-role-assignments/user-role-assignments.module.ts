import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { User } from '../../users/entities/user.entity.js';
import { UserOrganizationAssignment } from '../../user-organization-assignments/entities/user-organization-assignment.entity.js';

import { Role } from '../roles/entities/role.entity.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

import { UserRoleAssignment } from './entities/user-role-assignment.entity.js';
import { UserRoleAssignmentsController } from './user-role-assignments.controller.js';
import { UserRoleAssignmentsService } from './user-role-assignments.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRoleAssignment,
      User,
      Role,
      UserOrganizationAssignment,
    ]),
    AuthorizationModule,
  ],
  controllers: [UserRoleAssignmentsController],
  providers: [UserRoleAssignmentsService, JwtAuthGuard],
  exports: [UserRoleAssignmentsService],
})
export class UserRoleAssignmentsModule {}
