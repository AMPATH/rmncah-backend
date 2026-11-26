import { ApiProperty } from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../../common/dto/api-success-response.dto.js';

export class UserSessionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '192.0.2.10',
  })
  ipAddress: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Mozilla/5.0',
  })
  userAgent: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-23T18:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  lastUsedAt: Date | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-23T18:15:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: null,
  })
  revokedAt: Date | null;
}

export class UserSessionsResponseDto extends ApiSuccessResponseDto {
  @ApiProperty({
    type: UserSessionResponseDto,
    isArray: true,
  })
  data: UserSessionResponseDto[];
}
