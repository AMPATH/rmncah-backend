import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { User } from './entities/user.entity.js';
import { UserRoleAssignment } from '../rbac/user-role-assignments/entities/user-role-assignment.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsModule } from '../invitations/invitations.module.js';
import { SessionsModule } from '../../auth/sessions/sessions.module.js';
import { AuthorizationModule } from '../rbac/authorization/authorization.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRoleAssignment]),
    InvitationsModule,
    SessionsModule,
    AuthorizationModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
