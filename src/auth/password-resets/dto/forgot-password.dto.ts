import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

// Validates the email address requesting a password-reset link.
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address associated with the account requesting a reset.',
    format: 'email',
    maxLength: 255,
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;
}
