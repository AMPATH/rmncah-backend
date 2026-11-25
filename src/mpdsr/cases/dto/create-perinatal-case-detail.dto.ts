import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

import { BirthOutcome } from '../enums/case.enum.js';
import { IsNotFutureDate } from './validators/date.validators.js';

export class CreatePerinatalCaseDetailDto {
  @IsEnum(BirthOutcome)
  birthOutcome: BirthOutcome;

  // Gestational age at birth, stored as total days.
  @IsOptional()
  @IsInt()
  @Min(1)
  gestationalAgeDays?: number;

  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfDeath: string;

  @IsUUID()
  provisionalCauseId: string;
}
