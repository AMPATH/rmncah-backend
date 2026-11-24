import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address associated with the user account.',
    format: 'email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account password.',
    minLength: 8,
    format: 'password',
    writeOnly: true,
    example: 'Example-Password-123!',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
