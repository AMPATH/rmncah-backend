import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.configService.getOrThrow<string>('SMTP_PORT')),
      secure: this.configService.getOrThrow<string>('SMTP_SECURE') === 'true',

      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,

      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  // Verify SMTP connectivity and authentication.
  async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.error(
        'SMTP connection verification failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Email server connection could not be verified',
      );
    }
  }

  // Send a plain-text and/or HTML email.
  async sendEmail(options: SendEmailOptions): Promise<string> {
    try {
      const result = await this.transporter.sendMail({
        from: this.configService.getOrThrow<string>('SMTP_FROM'),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      });

      this.logger.log(`Email sent successfully: ${result.messageId}`);
      return result.messageId;
    } catch (error) {
      this.logger.error(
        'Email delivery failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException('Email could not be sent');
    }
  }
}
