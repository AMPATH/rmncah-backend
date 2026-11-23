import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

import {
  RecommendationAssignmentLevel,
  RecommendationClassification,
} from '../enums/recommendation-assignment.enum.js';

export class CreateRecommendationAssignmentDto {
  @IsEnum(RecommendationClassification)
  classification: RecommendationClassification;

  @IsEnum(RecommendationAssignmentLevel)
  targetLevel: RecommendationAssignmentLevel;

  @IsOptional()
  @IsUUID()
  countyId?: string;

  @IsOptional()
  @IsUUID()
  subCountyId?: string;

  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsUUID()
  communityUnitId?: string;

  @IsUUID()
  responsibleUserId: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Due date must use YYYY-MM-DD format.',
  })
  dueDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  instructions?: string;
}
