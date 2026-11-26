import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { RecommendationAssignmentLevel } from '../enums/recommendation-assignment.enum.js';

export class ReassignRecommendationAssignmentDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  instructions?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}
