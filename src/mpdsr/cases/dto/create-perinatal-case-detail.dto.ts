import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { BirthOutcome, PlaceOfBirth } from '../enums/case.enum.js';
import { IsNotFutureDate } from './validators/date.validators.js';

export class CreatePerinatalCaseDetailDto {
  @IsEnum(BirthOutcome)
  birthOutcome: BirthOutcome;

  // Gestational age at birth, stored as total days.
  @IsOptional()
  @IsInt()
  @Min(1)
  gestationalAgeDays?: number;

  // Birth weight stored in grams.
  @IsOptional()
  @IsInt()
  @Min(1)
  birthWeightGrams?: number;

  @IsEnum(PlaceOfBirth)
  placeOfBirth: PlaceOfBirth;

  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfDeath: string;
}
