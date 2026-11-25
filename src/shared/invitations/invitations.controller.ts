import {
  Controller,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface.js';

import { InvitationsService } from './invitations.service.js';

@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
  ) {}

  // Create a pending user account and send an invitation email.
  // Resend an invitation to a pending user account.
  @Post(':userId/resend')
  resend(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationsService.resendInvitation(
      userId,
      user.id,
    );
  }

  // Revoke an outstanding invitation.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @Param('id', ParseUUIDPipe) invitationId: string,
  ): Promise<void> {
    await this.invitationsService.revokeInvitation(invitationId);
  }
}
