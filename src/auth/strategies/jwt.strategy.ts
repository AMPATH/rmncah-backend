import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../shared/users/users.service.js';
import { AccountStatus } from '../../shared/users/enum/users.enum.js';
import { SessionsService } from '../sessions/sessions.service.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

interface JwtPayload {
  sub: string;
  sid: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.usersService.findOne(payload.sub);

    if (user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const sessionIsActive = await this.sessionsService.isSessionActive(
      payload.sid,
      user.id,
    );

    if (!sessionIsActive) {
      throw new UnauthorizedException('Session is no longer active');
    }

    return {
      id: user.id,
      sessionId: payload.sid,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
