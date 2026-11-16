import { Module } from '@nestjs/common';

import { RolesModule } from './roles/roles.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { RolePermissionsModule } from './role-permissions/role-permissions.module.js';
import { UserRoleAssignmentsModule } from './user-role-assignments/user-role-assignments.module.js';
import { AuthorizationModule } from './authorization/authorization.module.js';

@Module({
  imports: [
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    UserRoleAssignmentsModule,
    AuthorizationModule,
  ],
  exports: [
    RolesModule,
    PermissionsModule,
    RolePermissionsModule,
    UserRoleAssignmentsModule,
    AuthorizationModule,
  ],
})
export class RbacModule {}
