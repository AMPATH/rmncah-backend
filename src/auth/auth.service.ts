import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../shared/users/users.service.js';
import { AccountStatus } from '../shared/users/enum/users.enum.js';
import { PasswordService } from './password.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SessionsService } from './sessions/sessions.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
  ) {}

  // Authenticates a user and creates a login session.
  async login(
    loginDto: LoginDto,
    ipAddress: string | null = null,
    userAgent: string | null = null,
  ) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user || !user.passwordHash || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordIsValid = await this.passwordService.verify(
      user.passwordHash,
      loginDto.password,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.updateLastLogin(user.id);

    const { session, refreshToken } = await this.sessionsService.createSession(
      user.id,
      ipAddress,
      userAgent,
    );

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      sid: session.id,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  // Rotates the refresh token and issues a new access token.
  async refresh(currentRefreshToken: string) {
    const { session, refreshToken } =
      await this.sessionsService.rotateRefreshToken(currentRefreshToken);

    const user = await this.usersService.findOne(session.userId);

    if (user.status !== AccountStatus.ACTIVE) {
      await this.sessionsService.revokeSession(session.id, user.id);
      throw new UnauthorizedException('Account is not active');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      sid: session.id,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  // Retrieves all login sessions belonging to a user.
  async getSessions(userId: string) {
    return this.sessionsService.findUserSessions(userId);
  }

  // Revokes a specific login session belonging to a user.
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.sessionsService.revokeSession(sessionId, userId);
  }

  // Revokes the current login session.
  async logout(userId: string, sessionId: string): Promise<void> {
    await this.sessionsService.revokeSession(sessionId, userId);
  }

  // Revokes all login sessions belonging to a user.
  async logoutAll(userId: string): Promise<void> {
    await this.sessionsService.revokeAllSessions(userId);
  }
}
