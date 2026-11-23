import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { CaseContributingFactorReviewAction } from '../../cases/enums/case-contributing-factor.enum.js';

export class ReviewCaseContributingFactorDto {
  @IsEnum(CaseContributingFactorReviewAction)
  action: CaseContributingFactorReviewAction;

  @IsOptional()
  @IsUUID()
  caseContributingFactorId?: string;

  @IsOptional()
  @IsUUID()
  contributingFactorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
