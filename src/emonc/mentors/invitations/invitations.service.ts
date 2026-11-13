
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  randomBytes,
  createHash,
  randomInt,
  timingSafeEqual,
} from 'crypto';

import * as bcrypt from 'bcrypt';


import { MentorInvitation } from './entities/mentor-invitation.entity.js';
import { EmailService } from './email.service.js';

import { SetMentorPasswordDto } from '../dto/set-mentor-password.dto.js';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto.js';
import { VerifyMentorOtpDto } from '../dto/verify-mentor-otp.dto.js';

import { MentorInvitationStatus } from './enum/invitation.enum.js';
import { AccountStatus } from '../../../shared/users/enum/users.enum.js';
import { User } from '../../../shared/users/entities/user.entity.js';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(MentorInvitation)
    private readonly invitationRepository: Repository<MentorInvitation>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly emailService: EmailService,
  ) {}

  // Hash tokens and OTPs before storing them
  private hashToken(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex');
  }

  // Compare hashes safely
  private compareHashes(
    submittedHash: string,
    storedHash: string,
  ): boolean {
    const submittedBuffer = Buffer.from(submittedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (submittedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(submittedBuffer, storedBuffer);
  }

  // 1. Create mentor invitation
  async createInvitation(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Mentor not found');
    }

    if (user.status === AccountStatus.ACTIVE) {
      throw new ConflictException(
        'This mentor account is already active',
      );
    }

    // Find existing active invitations
    const existingInvitations =
      await this.invitationRepository.find({
        where: {
          userId,
          status: In([
            MentorInvitationStatus.PENDING,
            MentorInvitationStatus.OTP_SENT,
            MentorInvitationStatus.VERIFIED,
          ]),
        },
      });

    for (const invitation of existingInvitations) {
      if (invitation.expiresAt > new Date()) {
        throw new ConflictException(
          'An active invitation already exists for this mentor',
        );
      }

      invitation.status = MentorInvitationStatus.EXPIRED;
    }

    if (existingInvitations.length > 0) {
      await this.invitationRepository.save(existingInvitations);
    }

    // Generate secure invitation token
    const token = randomBytes(32).toString('hex');

    const invitation = this.invitationRepository.create({
      userId,
      tokenHash: this.hashToken(token),
      status: MentorInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const savedInvitation =
      await this.invitationRepository.save(invitation);

    // Send invitation email
    try {
      await this.emailService.sendMentorInvitation(
        user.email,
        user.firstName,
        token,
      );
    } catch (error) {
      savedInvitation.status = MentorInvitationStatus.REVOKED;

      await this.invitationRepository.save(savedInvitation);

      throw error;
    }

    return {
      invitationId: savedInvitation.id,
      expiresAt: savedInvitation.expiresAt,
      message: 'Mentor invitation sent successfully',
    };
  }

  // 2. Resend mentor invitation
  async resendInvitation(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Mentor not found');
    }

    if (user.status === AccountStatus.ACTIVE) {
      throw new ConflictException(
        'This mentor account is already active',
      );
    }

    // Find existing invitations
    const existingInvitations =
      await this.invitationRepository.find({
        where: {
          userId,
          status: In([
            MentorInvitationStatus.PENDING,
            MentorInvitationStatus.OTP_SENT,
            MentorInvitationStatus.VERIFIED,
          ]),
        },
      });

    // Expire previous invitations
    for (const invitation of existingInvitations) {
      invitation.status = MentorInvitationStatus.EXPIRED;
    }

    if (existingInvitations.length > 0) {
      await this.invitationRepository.save(existingInvitations);
    }

    // Generate new invitation token
    const token = randomBytes(32).toString('hex');

    const invitation = this.invitationRepository.create({
      userId,
      tokenHash: this.hashToken(token),
      status: MentorInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const savedInvitation =
      await this.invitationRepository.save(invitation);

    // Send new invitation email
    try {
      await this.emailService.sendMentorInvitation(
        user.email,
        user.firstName,
        token,
      );
    } catch (error) {
      savedInvitation.status = MentorInvitationStatus.REVOKED;

      await this.invitationRepository.save(savedInvitation);

      throw error;
    }

    return {
      message: 'Mentor invitation resent successfully',
      invitation: {
        id: savedInvitation.id,
        expiresAt: savedInvitation.expiresAt,
      },
    };
  }

  // 3. Accept invitation and generate OTP
  async acceptInvitation(dto: AcceptInvitationDto) {
    const tokenHash = this.hashToken(dto.invitationToken);

    const invitation = await this.invitationRepository.findOne({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.status !== MentorInvitationStatus.PENDING) {
      throw new ConflictException(
        'This invitation is no longer valid',
      );
    }

    // Check invitation expiry
    if (invitation.expiresAt <= new Date()) {
      invitation.status = MentorInvitationStatus.EXPIRED;

      await this.invitationRepository.save(invitation);

      throw new ConflictException('This invitation has expired');
    }

    // Retrieve associated mentor
    const user = await this.userRepository.findOne({
      where: { id: invitation.userId },
    });

    if (!user) {
      throw new NotFoundException('Mentor account not found');
    }

    if (user.status === AccountStatus.ACTIVE) {
      throw new ConflictException(
        'This mentor account is already active',
      );
    }

    // Generate secure six-digit OTP
    const otp = randomInt(100000, 1000000).toString();

    invitation.otpHash = this.hashToken(otp);

    // OTP expires after 10 minutes
    invitation.otpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000,
    );

    invitation.attempts = 0;

    invitation.acceptedAt = new Date();

    invitation.status = MentorInvitationStatus.OTP_SENT;

    // Save OTP information
    const savedInvitation =
      await this.invitationRepository.save(invitation);

    // Send OTP to mentor
    try {
      await this.emailService.sendOtp(
        user.email,
        user.firstName,
        otp,
      );
    } catch (error) {
      // Restore invitation if email delivery fails
      savedInvitation.status = MentorInvitationStatus.PENDING;
      savedInvitation.otpHash = null;
      savedInvitation.otpExpiresAt = null;
      savedInvitation.attempts = 0;

      await this.invitationRepository.save(savedInvitation);

      throw error;
    }

    return {
      invitationId: savedInvitation.id,
      message: 'OTP sent successfully',
      status: MentorInvitationStatus.OTP_SENT,
    };
  }

  // 4. Verify mentor OTP
  async verifyOtp(dto: VerifyMentorOtpDto) {
    const invitation = await this.invitationRepository.findOne({
      where: { id: dto.invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== MentorInvitationStatus.OTP_SENT) {
      throw new ConflictException(
        'This invitation is not awaiting OTP verification',
      );
    }

    // Check maximum attempts
    if (invitation.attempts >= 5) {
      invitation.status = MentorInvitationStatus.REVOKED;

      await this.invitationRepository.save(invitation);

      throw new ConflictException(
        'Maximum OTP attempts exceeded. Request a new invitation.',
      );
    }

    // Check OTP expiry
    if (
      !invitation.otpExpiresAt ||
      invitation.otpExpiresAt <= new Date()
    ) {
      invitation.status = MentorInvitationStatus.EXPIRED;
      invitation.otpHash = null;
      invitation.otpExpiresAt = null;

      await this.invitationRepository.save(invitation);

      throw new BadRequestException('OTP has expired');
    }

    if (!invitation.otpHash) {
      throw new ConflictException('OTP is no longer available');
    }

    // Hash submitted OTP and compare
    const submittedOtpHash = this.hashToken(dto.otp);

    const isValidOtp = this.compareHashes(
      submittedOtpHash,
      invitation.otpHash,
    );

    if (!isValidOtp) {
      invitation.attempts += 1;

      if (invitation.attempts >= 5) {
        invitation.status = MentorInvitationStatus.REVOKED;
        invitation.otpHash = null;
        invitation.otpExpiresAt = null;
      }

      await this.invitationRepository.save(invitation);

      throw new BadRequestException('Invalid OTP');
    }

    // OTP successfully verified
    invitation.status = MentorInvitationStatus.VERIFIED;
    invitation.verifiedAt = new Date();

    // Prevent OTP reuse
    invitation.otpHash = null;
    invitation.otpExpiresAt = null;

    await this.invitationRepository.save(invitation);

    return {
      invitationId: invitation.id,
      message: 'OTP verified successfully. You can now set your password.',
      status: MentorInvitationStatus.VERIFIED,
    };
  }

  // 5. Set mentor password and activate account
  async setPassword(dto: SetMentorPasswordDto) {
    // Validate password confirmation
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find invitation
    const invitation = await this.invitationRepository.findOne({
      where: { id: dto.invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Ensure OTP was verified
    if (invitation.status !== MentorInvitationStatus.VERIFIED) {
      throw new ConflictException(
        'You must verify your OTP before setting your password',
      );
    }

    // Find mentor
    const user = await this.userRepository.findOne({
      where: { id: invitation.userId },
    });

    if (!user) {
      throw new NotFoundException('Mentor account not found');
    }

    if (user.status === AccountStatus.ACTIVE) {
      throw new ConflictException(
        'This mentor account is already activated',
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Update account
    user.passwordHash = passwordHash;
    user.mustChangePassword = false;
    user.status = AccountStatus.ACTIVE;

    invitation.status = MentorInvitationStatus.COMPLETED;
    invitation.completedAt = new Date();

    // Save both changes in one transaction
    await this.userRepository.manager.transaction(
      async (manager) => {
        await manager.save(User, user);
        await manager.save(MentorInvitation, invitation);
      },
    );

    return {
      message: 'Password set successfully. Your mentor account is now active.',
      status: MentorInvitationStatus.COMPLETED,
    };
  }
}
