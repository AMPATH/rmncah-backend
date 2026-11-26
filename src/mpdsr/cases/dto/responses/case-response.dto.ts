import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  CaseStatus,
  CaseType,
  Gender,
  ReportingSetting,
} from '../../enums/case.enum.js';

import { MaternalCaseDetailResponseDto } from './maternal-case-detail-response.dto.js';
import { PerinatalCaseDetailResponseDto } from './perinatal-case-detail-response.dto.js';
import { NearMissDetailResponseDto } from './near-miss-detail-response.dto.js';
import { CaseContributingFactorResponseDto } from './case-contributing-factor-response.dto.js';

export class CaseResponseDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'MPDSR-MFL001-2026-000001' })
  caseNumber: string;

  @ApiProperty({ enum: CaseType, example: CaseType.MATERNAL })
  caseType: CaseType;

  @ApiProperty({ enum: CaseStatus, example: CaseStatus.NOTIFIED })
  status: CaseStatus;

  @ApiProperty({ enum: ReportingSetting, example: ReportingSetting.FACILITY })
  reportingSetting: ReportingSetting;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  facilityId: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  communityUnitId: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  responsibleFacilityId: string | null;

  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440050' })
  reportedBy: string;

  @ApiProperty({ type: String, format: 'date', example: '1990-04-15' })
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: Gender.FEMALE })
  gender: Gender;

  @ApiProperty({ type: String, format: 'date', example: '2026-10-12' })
  notificationDate: string;

  @ApiPropertyOptional({ nullable: true, example: 'Illustrative case comments.' })
  comments: string | null;

  @ApiPropertyOptional({
    type: () => MaternalCaseDetailResponseDto,
    nullable: true,
    description: 'Present for maternal cases.',
  })
  maternalDetails?: MaternalCaseDetailResponseDto | null;

  @ApiPropertyOptional({
    type: () => PerinatalCaseDetailResponseDto,
    nullable: true,
    description: 'Present for perinatal cases.',
  })
  perinatalDetails?: PerinatalCaseDetailResponseDto | null;

  @ApiPropertyOptional({
    type: () => NearMissDetailResponseDto,
    nullable: true,
    description: 'Present for near-miss cases.',
  })
  nearMissDetails?: NearMissDetailResponseDto | null;

  @ApiPropertyOptional({
    type: () => [CaseContributingFactorResponseDto],
    description: 'Loaded by the create and update endpoints.',
  })
  contributingFactors?: CaseContributingFactorResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
