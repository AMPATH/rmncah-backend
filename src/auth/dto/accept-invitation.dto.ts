import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Validates the invitation token and password submitted during account activation.
export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Single-use invitation token received by the invited user.',
    example: 'invitation-token-placeholder',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description:
      'New account password. Must contain uppercase and lowercase letters, a number, and a special character. Spaces are not allowed.',
    minLength: 12,
    maxLength: 128,
    format: 'password',
    writeOnly: true,
    example: 'Example-Password-123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?=\S+$).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, with no spaces',
  })
  password: string;
}
