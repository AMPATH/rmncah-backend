import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCaseRecommendationDto {
  @IsUUID(undefined)
  caseContributingFactorId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  recommendation: string;
}
