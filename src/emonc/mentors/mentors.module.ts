import { Module } from '@nestjs/common';
import { MentorsService } from './mentors.service.js';
import { MentorsController } from './mentors.controller.js';
import { UsersModule } from '../../shared/users/users.module.js';
import { User } from '../../shared/users/entities/user.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsService } from './invitations/invitations.service.js';
import { InvitationsModule } from './invitations/invitations.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule, InvitationsModule],
  controllers: [MentorsController],
  providers: [MentorsService],
})
export class MentorsModule {}
