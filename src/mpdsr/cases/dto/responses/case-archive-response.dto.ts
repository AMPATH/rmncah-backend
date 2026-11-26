import { ApiProperty } from '@nestjs/swagger';

export class CaseArchiveResponseDto {
  @ApiProperty({ example: 'Case successfully soft-deleted.' })
  message: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;
}
