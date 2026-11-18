import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';
import { Public } from './decorators/public.decorator.js';
import { PasswordResetsService } from './password-resets/password-resets.service.js';
import { ForgotPasswordDto } from './password-resets/dto/forgot-password.dto.js';
import { ResetPasswordDto } from './password-resets/dto/reset-password.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetsService: PasswordResetsService,
  ) {}

  // Returns the currently authenticated user.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  // Authenticates a user and creates a session.
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Accepts an invitation and activates the user's account.
  @Post('accept-invitation')
  @Public()
  @HttpCode(HttpStatus.OK)
  acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(acceptInvitationDto);
  }

  // Changes the authenticated user's password.
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  // Sends a password-reset link without revealing whether the email exists.
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetsService.requestPasswordReset(dto);
  }

  // Resets a password using a valid single-use email token.
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetsService.resetPassword(dto);
  }

  // Rotates the refresh token and issues new tokens.
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  // Returns all sessions belonging to the authenticated user.
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSessions(user.id);
  }

  // Revokes a specific session belonging to the authenticated user.
  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
  ): Promise<void> {
    await this.authService.revokeSession(user.id, sessionId);
  }

  // Revokes the current login session.
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(user.id, user.sessionId);
  }

  // Revokes all login sessions belonging to the authenticated user.
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logoutAll(user.id);
  }
}
