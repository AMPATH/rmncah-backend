import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  CaseRecommendationReviewStatus,
  CaseRecommendationSource,
} from '../../enums/case-recommendation.enum.js';

export class CaseRecommendationResponseDto {
  @ApiProperty({
    description: 'Unique recommendation identifier.',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the MPDSR case associated with this recommendation.',
    format: 'uuid',
  })
  caseId: string;

  @ApiProperty({
    description: 'ID of the contributing factor associated with this recommendation.',
    format: 'uuid',
  })
  caseContributingFactorId: string;

  @ApiProperty({
    description: 'Recommendation submitted for the case.',
  })
  recommendation: string;

  @ApiPropertyOptional({
    description: 'Approved or edited recommendation, when available.',
    nullable: true,
  })
  approvedRecommendation: string | null;

  @ApiProperty({
    description: 'Origin of the recommendation.',
    enum: CaseRecommendationSource,
    example: CaseRecommendationSource.REPORTER,
  })
  source: CaseRecommendationSource;

  @ApiProperty({
    description: 'Current review status of the recommendation.',
    enum: CaseRecommendationReviewStatus,
    example: CaseRecommendationReviewStatus.PENDING,
  })
  reviewStatus: CaseRecommendationReviewStatus;

  @ApiProperty({
    description: 'Date the recommendation was created.',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date the recommendation was last updated.',
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description:
      'Included when retrieving recommendations. Contains the associated case contributing factor and its contributing factor details.',
    type: 'object',
    additionalProperties: true,
  })
  caseContributingFactor?: Record<string, unknown>;
}
