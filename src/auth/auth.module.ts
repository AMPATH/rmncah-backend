import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../shared/email/email.module.js';
import { PasswordReset } from './password-resets/entities/password-reset.entity.js';
import { PasswordResetsService } from './password-resets/password-resets.service.js';

import { UsersModule } from '../shared/users/users.module.js';
import { InvitationsModule } from '../shared/invitations/invitations.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { SessionsModule } from './sessions/sessions.module.js';

@Module({
  imports: [
    UsersModule,
    InvitationsModule,
    EmailModule,
    TypeOrmModule.forFeature([PasswordReset]),
    PassportModule,
    
    SessionsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, PasswordResetsService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
