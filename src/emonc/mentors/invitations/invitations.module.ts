import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvitationsService } from './invitations.service.js';
import { MentorInvitation } from './entities/mentor-invitation.entity.js';
import { User } from '../../../shared/users/entities/user.entity.js';
import { EmailService } from './email.service.js';
import { InvitationsController } from './invitations.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([MentorInvitation, User])],
  controllers: [InvitationsController],
  providers: [InvitationsService, EmailService],
  exports: [InvitationsService],
})
export class InvitationsModule {}