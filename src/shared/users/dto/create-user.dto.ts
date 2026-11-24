import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user.',
    example: 'Mary',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user.',
    example: 'Kim',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Unique email address of the user.',
    example: 'mary.kim@gmail.com',
    maxLength: 150,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number.',
    example: '+254712345678',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'UUID of the user cadre.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  cadreId?: string;
}
