import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PregnancyPeriod } from '../../enums/case.enum.js';

export class NearMissDetailResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440013' })
  id: string;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  caseId: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-10-12' })
  dateOfComplication: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-10-12' })
  dateOfAdmission: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    nullable: true,
    example: null,
  })
  dateOfDischarge: string | null;

  @ApiProperty({
    enum: PregnancyPeriod,
    example: PregnancyPeriod.ANTENATAL,
  })
  periodOfComplication: PregnancyPeriod;

  @ApiProperty({ example: 2 })
  parity: number;

  @ApiPropertyOptional({ example: 28, nullable: true })
  gestationalAgeAtComplication: number | null;

  @ApiProperty({
    example: 'Illustrative clinical summary for documentation purposes.',
  })
  clinicalSummary: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
