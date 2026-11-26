import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'Indicates whether the request was successful.',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Unique identifier assigned to the request.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  requestId: string;

  @ApiProperty({
    description: 'Human-readable error message.',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code.',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'HTTP error classification.',
    example: 'Bad Request',
  })
  error: string;

  @ApiPropertyOptional({
    description: 'Additional validation error details, when available.',
    type: [String],
    example: ['email must be an email'],
  })
  details?: string[];

  @ApiProperty({
    description: 'Time when the error response was generated.',
    type: String,
    format: 'date-time',
    example: '2026-11-23T18:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path that produced the error.',
    example: '/api/auth/login',
  })
  path: string;

  @ApiProperty({
    description: 'HTTP method used for the request.',
    example: 'POST',
  })
  method: string;
}
