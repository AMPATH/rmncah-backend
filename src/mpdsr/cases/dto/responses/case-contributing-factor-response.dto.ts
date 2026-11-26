import { ApiProperty } from '@nestjs/swagger';

import {
  CaseContributingFactorReviewStatus,
  CaseContributingFactorSource,
} from '../../enums/case-contributing-factor.enum.js';
import { DelayLevel } from '../../../contributing-factors/enums/delay-level.enum.js';

export class ContributingFactorResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440030' })
  id: string;

  @ApiProperty({ example: 'CF-001' })
  code: string;

  @ApiProperty({ enum: DelayLevel, example: DelayLevel.FIRST })
  delayLevel: DelayLevel;

  @ApiProperty({ example: 'Illustrative contributing factor' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CaseContributingFactorResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440040' })
  id: string;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  caseId: string;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440030' })
  contributingFactorId: string;

  @ApiProperty({ example: true })
  reporterSelected: boolean;

  @ApiProperty({
    enum: CaseContributingFactorSource,
    example: CaseContributingFactorSource.REPORTER,
  })
  source: CaseContributingFactorSource;

  @ApiProperty({
    enum: CaseContributingFactorReviewStatus,
    example: CaseContributingFactorReviewStatus.PENDING,
  })
  reviewStatus: CaseContributingFactorReviewStatus;

  @ApiProperty({ type: () => ContributingFactorResponseDto })
  contributingFactor: ContributingFactorResponseDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
