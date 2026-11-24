import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { EmailService } from '../email/email.service.js';
import { AccountStatus } from '../users/enum/users.enum.js';
import { User } from '../users/entities/user.entity.js';

import { Invitation } from './entities/invitation.entity.js';

@Injectable()
export class InvitationsService {
  private readonly invitationExpiryHours = 24;

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  // Issue the first system administrator invitation during one-time bootstrap.
  async issueBootstrapInvitation(userId: string): Promise<void> {
    await this.issueInvitation(userId, null);
  }

  // Issue a new invitation for an existing pending user.
  async issueInvitation(
    userId: string,
    invitedByUserId: string | null,
  ): Promise<void> {
    const user = await this.findUser(userId);

    if (user.status !== AccountStatus.PENDING) {
      throw new BadRequestException(
        'An invitation can only be issued to a pending account',
      );
    }

    // Revoke any previous unaccepted invitations.
    await this.invitationRepository
      .createQueryBuilder()
      .update(Invitation)
      .set({ revokedAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('acceptedAt IS NULL')
      .andWhere('revokedAt IS NULL')
      .execute();

    // Generate a secure random token.
    const token = randomBytes(32).toString('hex');

    // Store only the SHA-256 hash of the token.
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(
      Date.now() + this.invitationExpiryHours * 60 * 60 * 1000,
    );

    const invitation = this.invitationRepository.create({
      userId,
      invitedByUserId,
      tokenHash,
      expiresAt,
    });

    await this.invitationRepository.save(invitation);

    const frontendUrl = this.configService
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/+$/, '');

    const invitationUrl = `${frontendUrl}/accept-invitation?token=${encodeURIComponent(token)}`;

    const fullName = `${user.firstName} ${user.lastName}`;

    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Your RMNCAH System Account Invitation',
        text: [
          `Hello ${fullName},`,
          '',
          'An account has been created for you in the RMNCAH System.',
          '',
          'Use the following link to activate your account and set your password:',
          invitationUrl,
          '',
          'This invitation expires in 24 hours.',
          '',
          'If you were not expecting this invitation, you can ignore this email.',
        ].join('\n'),
        html: `
          <p>Hello ${this.escapeHtml(fullName)},</p>
          <p>
            An account has been created for you in the RMNCAH System.
          </p>
          <p>
            Use the link below to activate your account and set your password:
          </p>
          <p>
            <a href="${invitationUrl}">Accept invitation</a>
          </p>
          <p>This invitation expires in 24 hours.</p>
          <p>
            If you were not expecting this invitation, you can ignore this email.
          </p>
        `,
      });
    } catch (error) {
      // Prevent an invitation from remaining usable if email delivery fails.
      invitation.revokedAt = new Date();
      await this.invitationRepository.save(invitation);

      throw error;
    }
  }

  // Resend an invitation to an existing pending user.
  async resendInvitation(userId: string, invitedByUserId: string) {
    const user = await this.findUser(userId);

    if (user.status !== AccountStatus.PENDING) {
      throw new BadRequestException(
        'An invitation can only be resent to a pending account',
      );
    }

    await this.issueInvitation(userId, invitedByUserId);

    return {
      message: 'Invitation email sent successfully',
    };
  }

  // Revoke an outstanding invitation.
  async revokeInvitation(invitationId: string): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('An accepted invitation cannot be revoked');
    }

    if (invitation.revokedAt) {
      throw new BadRequestException('Invitation has already been revoked');
    }

    invitation.revokedAt = new Date();

    await this.invitationRepository.save(invitation);
  }

  // Accept an invitation and activate the associated user account atomically.
  async acceptInvitation(token: string, passwordHash: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await this.dataSource.transaction(async (manager) => {
      const invitationRepository = manager.getRepository(Invitation);
      const userRepository = manager.getRepository(User);

      // Lock the invitation so concurrent requests cannot accept it twice.
      const invitation = await invitationRepository.findOne({
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' },
      });

      const now = new Date();

      // Use one generic error to avoid revealing invitation state.
      if (
        !invitation ||
        invitation.acceptedAt ||
        invitation.revokedAt ||
        invitation.expiresAt <= now
      ) {
        throw new BadRequestException('Invitation is invalid or expired');
      }

      // Lock the associated account before activating it.
      const user = await userRepository.findOne({
        where: { id: invitation.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user || user.status !== AccountStatus.PENDING) {
        throw new BadRequestException('Invitation is invalid or expired');
      }

      // Activate the account and record invitation acceptance.
      await userRepository.update(user.id, {
        passwordHash,
        status: AccountStatus.ACTIVE,
        mustChangePassword: false,
        invitationAcceptedAt: now,
      });

      await invitationRepository.update(invitation.id, {
        acceptedAt: now,
      });
    });
  }

  // Escape user-provided text before placing it in an HTML email.
  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[character];
    });
  }

  // Revoke all outstanding invitations belonging to a user.
  async revokeUserInvitations(
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(Invitation)
      : this.invitationRepository;

    await repository
      .createQueryBuilder()
      .update(Invitation)
      .set({ revokedAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('acceptedAt IS NULL')
      .andWhere('revokedAt IS NULL')
      .execute();
  }
}
