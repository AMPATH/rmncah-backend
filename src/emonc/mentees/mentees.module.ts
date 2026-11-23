import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MenteesController } from './mentees.controller.js';
import { MenteesService } from './mentees.service.js';

import { User } from '../../shared/users/entities/user.entity.js';
import { Role } from '../../shared/rbac/roles/entities/role.entity.js';
import { UserRoleAssignment } from '../../shared/rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { UserOrganizationAssignment } from '../../shared/user-organization-assignments/entities/user-organization-assignment.entity.js';

import { UsersModule } from '../../shared/users/users.module.js';
import { RolesModule } from '../../shared/rbac/roles/roles.module.js';
import { UserRoleAssignmentsModule } from '../../shared/rbac/user-role-assignments/user-role-assignments.module.js';
import { UserOrganizationAssignmentsModule } from '../../shared/user-organization-assignments/user-organization-assignments.module.js';
import { InvitationsModule } from '../mentors/invitations/invitations.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRoleAssignment,
      UserOrganizationAssignment,
    ]),
    UsersModule,
    RolesModule,
    UserRoleAssignmentsModule,
    UserOrganizationAssignmentsModule,
    InvitationsModule,
  ],
  controllers: [MenteesController],
  providers: [MenteesService],
  exports: [MenteesService],
})
export class MenteesModule {}