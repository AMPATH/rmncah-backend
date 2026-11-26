import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Validates a password-reset token and the replacement password.
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Single-use password-reset token received by email.',
    maxLength: 128,
    example: 'password-reset-token-placeholder',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  token: string;

  @ApiProperty({
    description:
      'Replacement password. Must contain uppercase and lowercase letters, a number, and a special character. Spaces are not allowed.',
    minLength: 12,
    maxLength: 128,
    format: 'password',
    writeOnly: true,
    example: 'New-Example-Password-456!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?=\S+$).+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, with no spaces',
    },
  )
  newPassword: string;
}
