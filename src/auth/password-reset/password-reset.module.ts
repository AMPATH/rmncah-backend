
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';


import { PasswordReset } from './entities/password-reset.entity.js';
import { User } from '../../shared/users/entities/user.entity.js';
import { UserSession } from '../sessions/entities/user-session.entity.js';

import { PasswordService } from '../password.service.js';
import { PasswordResetsController } from './password-resets.controller.js';
import { PasswordResetsService } from './password-resets.service.js';
import { EmailService } from '../../emonc/mentors/invitations/email.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PasswordReset,
      User,
      UserSession,
    ]),
  ],
  controllers: [PasswordResetsController],
  providers: [
    PasswordResetsService,
    EmailService,
    PasswordService,
  ],
  exports: [PasswordResetsService],
})
export class PasswordResetsModule {}
