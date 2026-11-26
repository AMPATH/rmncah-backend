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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

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
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto.js';
import { AuthenticatedUserApiResponseDto } from './dto/responses/authenticated-user-response.dto.js';
import { LoginResponseDto } from './dto/responses/login-response.dto.js';
import { RefreshTokenResponseDto } from './dto/responses/refresh-token-response.dto.js';
import { MessageResponseDto } from './dto/responses/message-response.dto.js';
import { UserSessionsResponseDto } from './dto/responses/user-session-response.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetsService: PasswordResetsService,
  ) {}

  // Returns the currently authenticated user.
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Returns the profile of the currently authenticated user.',
  })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Authenticated user retrieved successfully.',
    type: AuthenticatedUserApiResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Missing, invalid or expired access token.',
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  // Authenticates a user and creates a session.
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticates a user and creates a login session.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Authentication successful.',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Invalid request data.',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Invalid login credentials.',
  })
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Accepts an invitation and activates the user's account.
  @ApiOperation({
    summary: 'Accept account invitation',
    description:
      'Validates an invitation token and activates the user account.',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiOkResponse({
    description: 'Invitation accepted successfully.',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Invalid invitation or request data.',
  })
  @Post('accept-invitation')
  @Public()
  @HttpCode(HttpStatus.OK)
  acceptInvitation(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(acceptInvitationDto);
  }

  // Changes the authenticated user's password.
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes the password of the authenticated user.',
  })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({
    description: 'Password changed successfully.',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication required.',
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Invalid password or request data.',
  })
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
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Requests a password-reset link without revealing whether the email exists.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({
    description: 'Password-reset request processed.',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Invalid email address.',
  })
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetsService.requestPasswordReset(dto);
  }

  // Resets a password using a valid single-use email token.
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets a password using a valid single-use email token.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    description: 'Password reset successfully.',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Invalid request data or reset token.',
  })
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetsService.resetPassword(dto);
  }

  // Rotates the refresh token and issues new tokens.
  @ApiOperation({
    summary: 'Refresh authentication tokens',
    description:
      'Rotates the refresh token and issues new authentication tokens.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    description: 'Authentication tokens refreshed successfully.',
    type: RefreshTokenResponseDto,
  })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Invalid request data.',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description:
      'Invalid, expired, revoked or reused refresh token, or inactive account.',
  })
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  // Returns all sessions belonging to the authenticated user.
  @ApiOperation({
    summary: 'Get active sessions',
    description:
      'Returns the login sessions belonging to the authenticated user.',
  })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'User sessions retrieved successfully.',
    type: UserSessionsResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication required.',
  })
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSessions(user.id);
  }

  // Revokes a specific session belonging to the authenticated user.
  @ApiOperation({
    summary: 'Revoke a session',
    description:
      'Revokes a specific login session belonging to the authenticated user.',
  })
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'id',
    description: 'ID of the session to revoke.',
    type: String,
  })
  @ApiNoContentResponse({ description: 'Session revoked successfully.' })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication required.',
  })
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
  @ApiOperation({
    summary: 'Logout',
    description: 'Revokes the current authenticated session.',
  })
  @ApiBearerAuth('access-token')
  @ApiNoContentResponse({ description: 'Logout successful.' })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication required.',
  })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(user.id, user.sessionId);
  }

  // Revokes all login sessions belonging to the authenticated user.
  @ApiOperation({
    summary: 'Logout from all sessions',
    description:
      'Revokes all login sessions belonging to the authenticated user.',
  })
  @ApiBearerAuth('access-token')
  @ApiNoContentResponse({ description: 'All sessions revoked successfully.' })
  @ApiUnauthorizedResponse({
    type: ApiErrorResponseDto,
    description: 'Authentication required.',
  })
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logoutAll(user.id);
  }
}
