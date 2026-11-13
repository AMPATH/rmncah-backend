
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { InvitationsService } from './invitations.service.js';

import { AcceptInvitationDto } from '../dto/accept-invitation.dto.js';
import { SetMentorPasswordDto } from '../dto/set-mentor-password.dto.js';
import { VerifyMentorOtpDto } from '../dto/verify-mentor-otp.dto.js';

@Controller('mentors/invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
  ) {}

  // Accept invitation and send OTP
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.acceptInvitation(dto);
  }


  // Verify OTP
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyMentorOtpDto) {
    return this.invitationsService.verifyOtp(dto);
  }

  // Set password and activate account
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  setPassword(@Body() dto: SetMentorPasswordDto) {
    return this.invitationsService.setPassword(dto);
  }
}
