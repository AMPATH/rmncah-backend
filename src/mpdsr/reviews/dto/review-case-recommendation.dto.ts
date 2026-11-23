import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum CaseRecommendationReviewAction {
  CONFIRM = 'CONFIRM',
  EDIT = 'EDIT',
  REMOVE = 'REMOVE',
  ADD = 'ADD',
}

export class ReviewCaseRecommendationDto {
  @IsEnum(CaseRecommendationReviewAction)
  action: CaseRecommendationReviewAction;

  @IsOptional()
  @IsUUID()
  caseRecommendationId?: string;

  @IsOptional()
  @IsUUID()
  caseContributingFactorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recommendation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
