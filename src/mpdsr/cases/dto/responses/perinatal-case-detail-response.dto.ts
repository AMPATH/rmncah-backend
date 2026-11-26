import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BirthOutcome } from '../../enums/case.enum.js';
import { Icd11CauseResponseDto } from './icd11-cause-response.dto.js';

export class PerinatalCaseDetailResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440012' })
  id: string;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  caseId: string;

  @ApiProperty({ enum: BirthOutcome, example: BirthOutcome.STILLBIRTH })
  birthOutcome: BirthOutcome;

  @ApiProperty({ type: String, format: 'date', example: '2026-10-12' })
  dateOfDeath: string;

  @ApiPropertyOptional({ example: 252, nullable: true })
  gestationalAgeDays: number | null;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440020' })
  provisionalCauseId: string;

  @ApiPropertyOptional({
    type: () => Icd11CauseResponseDto,
    description: 'Loaded on the individual case retrieval endpoint.',
  })
  provisionalCause?: Icd11CauseResponseDto;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: null,
  })
  finalCauseId: string | null;

  @ApiPropertyOptional({
    type: () => Icd11CauseResponseDto,
    nullable: true,
    description: 'Loaded on the individual case retrieval endpoint when available.',
  })
  finalCause?: Icd11CauseResponseDto | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
