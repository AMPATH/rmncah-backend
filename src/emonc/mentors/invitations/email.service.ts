
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.configService.getOrThrow<string>('SMTP_PORT')),
      secure:
        this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  // Escape user-provided values before inserting them into HTML.
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

  // Send mentor invitation email.
  async sendMentorInvitation(
    email: string,
    firstName: string,
    invitationToken: string,
  ): Promise<void> {
    try {
      const frontendUrl =
        this.configService.getOrThrow<string>('FRONTEND_URL');

      const invitationLink = new URL(
        '/accept-invitation',
        frontendUrl,
      );

      invitationLink.searchParams.set('token', invitationToken);

      const safeFirstName = this.escapeHtml(firstName);
      const link = invitationLink.toString();

      await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>('SMTP_FROM'),
        to: email,
        subject: 'Invitation to join the EmONC Training System',

        text: `
Hello ${firstName},

You have been invited to join the EmONC Training System as a mentor.

Please use the link below to accept your invitation:

${link}

This invitation expires in 24 hours.

If you were not expecting this invitation, please ignore this email.
        `,

        html: `
          <h2>Hello ${safeFirstName},</h2>

          <p>
            You have been invited to join the EmONC Training System
            as a mentor.
          </p>

          <p>Click the button below to accept your invitation:</p>
          <p>Or copy and paste this link into your browser:</p>

    <p style="word-break: break-all;">
      ${this.escapeHtml(link)}
    </p>

          <a
            href="${link}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            "
          >
            Accept Invitation
          </a>

          <p>This invitation expires in 24 hours.</p>

          <p>
            If you were not expecting this invitation,
            please ignore this email.
          </p>
        `,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send mentor invitation email',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Failed to send mentor invitation email',
      );
    }
  }

  // Send OTP verification email.
  async sendOtp(
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    try {
      const safeFirstName = this.escapeHtml(firstName);
      const safeOtp = this.escapeHtml(otp);

      await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>('SMTP_FROM'),
        to: email,
        subject: 'EmONC Mentor Account Verification',

        text: `
Hello ${firstName},

Your verification code is: ${otp}

This code expires in 10 minutes.

If you did not request this verification, please ignore this email.
        `,

        html: `
          <h2>Hello ${safeFirstName},</h2>

          <p>
            Use the verification code below to verify your invitation:
          </p>

          <h1 style="letter-spacing: 5px;">${safeOtp}</h1>

          <p>This code expires in 10 minutes.</p>

          <p>
            If you did not request this verification,
            please ignore this email.
          </p>
        `,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send OTP verification email',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Failed to send OTP verification email',
      );
    }
  }
}
