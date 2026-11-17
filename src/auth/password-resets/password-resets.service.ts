import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, IsNull } from 'typeorm';

import { EmailService } from '../../shared/email/email.service.js';
import { User } from '../../shared/users/entities/user.entity.js';
import { AccountStatus } from '../../shared/users/enum/users.enum.js';
import { UserSession } from '../sessions/entities/user-session.entity.js';
import { PasswordService } from '../password.service.js';
import { PasswordReset } from './entities/password-reset.entity.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

const RESET_TOKEN_DURATION_MINUTES = 30;

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an active account exists for that email, a password-reset link has been sent.';

@Injectable()
export class PasswordResetsService {
  private readonly logger = new Logger(PasswordResetsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Hashes reset tokens before storing or looking them up.
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Escapes user-provided text before inserting it into an HTML email.
  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const replacements: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return replacements[character];
    });
  }

  // Requests a reset link without revealing whether an email is registered.
  async requestPasswordReset(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const resetDetails = await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const resetsRepository = manager.getRepository(PasswordReset);

      const user = await usersRepository.findOne({
        where: {
          email,
          status: AccountStatus.ACTIVE,
        },
      });

      if (!user) {
        return null;
      }

      // Invalidate previous unused reset links for this account.
      await resetsRepository.update(
        {
          userId: user.id,
          usedAt: IsNull(),
          revokedAt: IsNull(),
        },
        {
          revokedAt: now,
        },
      );

      const reset = resetsRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(
          now.getTime() + RESET_TOKEN_DURATION_MINUTES * 60 * 1000,
        ),
        usedAt: null,
        revokedAt: null,
      });

      await resetsRepository.save(reset);

      return {
        resetId: reset.id,
        firstName: user.firstName,
        email: user.email,
      };
    });

    if (!resetDetails) {
      return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
    }

    const frontendUrl = this.configService
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/+$/, '');

    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const firstName = this.escapeHtml(resetDetails.firstName);

    try {
      await this.emailService.sendEmail({
        to: resetDetails.email,
        subject: 'Reset your RMNCAH System password',
        text: [
          `Hello ${resetDetails.firstName},`,
          '',
          'We received a request to reset your RMNCAH System password.',
          `Use this link to choose a new password: ${resetUrl}`,
          '',
          `This link expires in ${RESET_TOKEN_DURATION_MINUTES} minutes and can only be used once.`,
          'If you did not request this reset, you can ignore this email.',
        ].join('\n'),
        html: `
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your RMNCAH System password.</p>
          <p>
            <a href="${resetUrl}">Reset your password</a>
          </p>
          <p>
            This link expires in ${RESET_TOKEN_DURATION_MINUTES} minutes
            and can only be used once.
          </p>
          <p>If you did not request this reset, you can ignore this email.</p>
        `,
      });
    } catch (error) {
      // Revoke the token if email delivery fails.
      await this.dataSource.getRepository(PasswordReset).update(
        {
          id: resetDetails.resetId,
          revokedAt: IsNull(),
        },
        {
          revokedAt: new Date(),
        },
      );

      this.logger.error(
        'Password-reset email could not be delivered',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
  }

  // Consumes a valid reset token and atomically updates the password and sessions.
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.token);
    const newPasswordHash = await this.passwordService.hash(dto.newPassword);

    await this.dataSource.transaction(async (manager) => {
      const resetsRepository = manager.getRepository(PasswordReset);
      const usersRepository = manager.getRepository(User);
      const sessionsRepository = manager.getRepository(UserSession);

      const reset = await resetsRepository.findOne({
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' },
      });

      const now = new Date();

      if (!reset || reset.usedAt || reset.revokedAt || reset.expiresAt <= now) {
        throw new BadRequestException(
          'Password-reset link is invalid or expired',
        );
      }

      const user = await usersRepository.findOne({
        where: {
          id: reset.userId,
          status: AccountStatus.ACTIVE,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new BadRequestException(
          'Password-reset link is invalid or expired',
        );
      }

      // Update the password and clear any forced password-change flag.
      await usersRepository.update(
        { id: user.id },
        {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        },
      );

      // Mark this token as used.
      await resetsRepository.update({ id: reset.id }, { usedAt: now });

      // Invalidate all other unused reset tokens for this account.
      await resetsRepository.update(
        {
          userId: user.id,
          usedAt: IsNull(),
          revokedAt: IsNull(),
        },
        { revokedAt: now },
      );

      // Revoke every active login session in the same transaction.
      await sessionsRepository.update(
        {
          userId: user.id,
          revokedAt: IsNull(),
        },
        {
          revokedAt: now,
        },
      );
    });

    return {
      message:
        'Password reset successfully. Please log in with your new password.',
    };
  }
}
