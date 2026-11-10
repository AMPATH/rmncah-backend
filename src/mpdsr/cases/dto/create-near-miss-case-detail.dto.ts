import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

import {
  IsNotFutureDate,
  IsSameOrAfterDate,
} from './validators/date.validators.js';

import { PregnancyPeriod } from '../enums/case.enum.js';

export class CreateNearMissCaseDetailDto {
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfComplication: string;

  @IsDateString({ strict: true })
  @IsNotFutureDate()
  @IsSameOrAfterDate('dateOfComplication')
  dateOfAdmission: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  @IsSameOrAfterDate('dateOfAdmission')
  dateOfDischarge?: string;

  @IsEnum(PregnancyPeriod)
  periodOfComplication: PregnancyPeriod;

  @IsInt()
  @Min(0)
  parity: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(45)
  gestationalAgeAtComplication?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  clinicalSummary: string;
}
