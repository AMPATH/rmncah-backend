import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../shared/users/users.service.js';
import { AccountStatus } from '../shared/users/enum/users.enum.js';
import { InvitationsService } from '../shared/invitations/invitations.service.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
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
    private readonly invitationsService: InvitationsService,
  ) {}

  // Activates a pending account using a valid invitation and a new password.
  async acceptInvitation(
    acceptInvitationDto: AcceptInvitationDto,
  ): Promise<{ message: string }> {
    const passwordHash = await this.passwordService.hash(
      acceptInvitationDto.password,
    );

    await this.invitationsService.acceptInvitation(
      acceptInvitationDto.token,
      passwordHash,
    );

    return {
      message: 'Account activated successfully. You can now log in.',
    };
  }

  // Changes the authenticated user's password and revokes all active sessions.
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByIdWithPassword(userId);

    if (
      !user ||
      !user.passwordHash ||
      user.status !== AccountStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const currentPasswordIsValid = await this.passwordService.verify(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!currentPasswordIsValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordIsSame = await this.passwordService.verify(
      user.passwordHash,
      dto.newPassword,
    );

    if (newPasswordIsSame) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const newPasswordHash = await this.passwordService.hash(
      dto.newPassword,
    );

    const passwordUpdated =
      await this.usersService.updatePasswordIfUnchanged(
        user.id,
        user.passwordHash,
        newPasswordHash,
      );

    if (!passwordUpdated) {
      throw new UnauthorizedException(
        'Password could not be changed. Please log in again.',
      );
    }

    // All existing sessions, including the current one, must authenticate again.
    await this.sessionsService.revokeAllSessions(user.id);

    return {
      message: 'Password changed successfully. Please log in again.',
    };
  }

  // Authenticates a user and creates a login session.
  async login(
  loginDto: LoginDto,
  ipAddress: string | null = null,
  userAgent: string | null = null,
) {
  const user = await this.usersService.findByEmailWithPassword(
    loginDto.email,
  );

  console.log('LOGIN CHECK:', {
    userFound: !!user,
    email: loginDto.email,
    hasPasswordHash: !!user?.passwordHash,
    status: user?.status,
    accountStatusActive: user?.status === AccountStatus.ACTIVE,
  });

  if (!user || !user.passwordHash || user.status !== AccountStatus.ACTIVE) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const passwordIsValid = await this.passwordService.verify(
    user.passwordHash,
    loginDto.password,
  );

  console.log('PASSWORD VERIFICATION:', passwordIsValid);

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
  // async login(
  //   loginDto: LoginDto,
  //   ipAddress: string | null = null,
  //   userAgent: string | null = null,
  // ) {
  //   const user = await this.usersService.findByEmailWithPassword(
  //     loginDto.email,
  //   );

  //   if (!user || !user.passwordHash || user.status !== AccountStatus.ACTIVE) {
  //     throw new UnauthorizedException('Invalid email or password');
  //   }

  //   const passwordIsValid = await this.passwordService.verify(
  //     user.passwordHash,
  //     loginDto.password,
  //   );

  //   if (!passwordIsValid) {
  //     throw new UnauthorizedException('Invalid email or password');
  //   }

  //   await this.usersService.updateLastLogin(user.id);

  //   const { session, refreshToken } = await this.sessionsService.createSession(
  //     user.id,
  //     ipAddress,
  //     userAgent,
  //   );

  //   const accessToken = await this.jwtService.signAsync({
  //     sub: user.id,
  //     sid: session.id,
  //   });

  //   return {
  //     accessToken,
  //     refreshToken,
  //     tokenType: 'Bearer',
  //     expiresIn: 900,
  //     user: {
  //       id: user.id,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //       email: user.email,
  //       status: user.status,
  //       mustChangePassword: user.mustChangePassword,
  //     },
  //   };
  // }

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
