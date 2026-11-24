import { ApiProperty } from '@nestjs/swagger';

import { CaseRecommendationReviewStatus } from '../../../recommendations/enums/case-recommendation.enum.js';
import { RecommendationAssignmentResponseDto } from './recommendation-assignment-response.dto.js';

export class RecommendationHistorySummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  caseId: string;

  @ApiProperty()
  caseNumber: string;

  @ApiProperty()
  recommendation: string;

  @ApiProperty({ type: String, nullable: true })
  approvedRecommendation: string | null;

  @ApiProperty({ enum: CaseRecommendationReviewStatus })
  reviewStatus: CaseRecommendationReviewStatus;
}

export class RecommendationAssignmentHistoryResponseDto {
  @ApiProperty({
    description: 'Recommendation associated with this assignment history.',
    type: RecommendationHistorySummaryResponseDto,
  })
  recommendation: RecommendationHistorySummaryResponseDto;

  @ApiProperty({
    description: 'Assignment history, ordered from oldest to newest.',
    type: () => [RecommendationAssignmentResponseDto],
  })
  assignments: RecommendationAssignmentResponseDto[];
}
