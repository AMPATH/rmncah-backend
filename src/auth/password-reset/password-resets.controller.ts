
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { PasswordResetsService } from './password-resets.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Controller('auth/password-resets')
export class PasswordResetsController {
  constructor(
    private readonly passwordResetsService: PasswordResetsService,
  ) {}

  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetsService.requestPasswordReset(dto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetsService.resetPassword(dto);
  }
}
