import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PregnancyPeriod } from '../../enums/case.enum.js';
import { Icd11CauseResponseDto } from './icd11-cause-response.dto.js';

export class MaternalCaseDetailResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440011' })
  id: string;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  caseId: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-10-12' })
  dateOfDeath: string;

  @ApiProperty({ enum: PregnancyPeriod, example: PregnancyPeriod.ANTENATAL })
  deathPeriod: PregnancyPeriod;

  @ApiPropertyOptional({ example: 32, nullable: true })
  gestationAtDeath: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  daysPostpartum: number | null;

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
