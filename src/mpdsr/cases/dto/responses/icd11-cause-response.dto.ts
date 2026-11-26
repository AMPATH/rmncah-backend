import { ApiProperty } from '@nestjs/swagger';

export class Icd11CauseResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440010' })
  id: string;

  @ApiProperty({ example: 'ICD11-CODE' })
  code: string;

  @ApiProperty({ example: 'Illustrative ICD-11 cause description' })
  description: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
