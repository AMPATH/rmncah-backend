import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationMetaDto } from './pagination-meta.dto.js';

export class ApiSuccessResponseDto {
  @ApiProperty({
    description: 'Indicates whether the request was successful.',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Unique identifier assigned to the request.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  requestId: string;

  @ApiProperty({
    description: 'Human-readable response message.',
    example: 'Request successful',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Pagination information, included for paginated responses.',
    type: PaginationMetaDto,
  })
  meta?: PaginationMetaDto;

  @ApiProperty({
    description: 'Time when the response was generated.',
    type: String,
    format: 'date-time',
    example: '2026-11-23T18:30:00.000Z',
  })
  timestamp: string;
}
