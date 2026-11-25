import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

// Validates the email address requesting a password-reset link.
export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;
}
