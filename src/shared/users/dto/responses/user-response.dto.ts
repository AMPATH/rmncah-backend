import { ApiProperty } from '@nestjs/swagger';

import { AccountStatus } from '../../enum/users.enum.js';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User first name.',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name.',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User email address.',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User phone number.',
    example: '+254712345678',
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiProperty({
    description: 'Identifier of the user cadre.',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  cadreId: string | null;

  @ApiProperty({
    description: 'Current account status.',
    enum: AccountStatus,
    example: AccountStatus.PENDING,
  })
  status: AccountStatus;

  @ApiProperty({
    description: 'Whether the user must change their password.',
    example: true,
  })
  mustChangePassword: boolean;

  @ApiProperty({
    description: 'Timestamp of the last successful login.',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-11-23T18:30:00.000Z',
  })
  lastLoginAt: Date | null;

  @ApiProperty({
    description: 'Timestamp when the user account was created.',
    type: String,
    format: 'date-time',
    example: '2026-11-20T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the user account was last updated.',
    type: String,
    format: 'date-time',
    example: '2026-11-23T18:30:00.000Z',
  })
  updatedAt: Date;
}
