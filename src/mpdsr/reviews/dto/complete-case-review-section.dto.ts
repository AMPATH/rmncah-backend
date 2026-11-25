import { IsIn } from 'class-validator';

export class CompleteCaseReviewSectionDto {
  @IsIn(['CAUSE', 'CONTRIBUTING_FACTORS', 'RECOMMENDATIONS'])
  section!: 'CAUSE' | 'CONTRIBUTING_FACTORS' | 'RECOMMENDATIONS';
}
