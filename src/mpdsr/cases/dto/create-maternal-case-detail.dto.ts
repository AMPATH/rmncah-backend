import {
  IsDateString,
  IsEnum,
  IsInt,
  IsDefined,
  Min,
  Max,
  ValidateIf,
  IsUUID,
} from 'class-validator';

import { PregnancyPeriod } from '../enums/case.enum.js';

import { IsNotFutureDate } from './validators/date.validators.js';

export class CreateMaternalCaseDetailDto {
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfDeath: string;

  @IsEnum(PregnancyPeriod)
  deathPeriod: PregnancyPeriod;

  @IsUUID()
  provisionalCauseId: string;

  // Required for antenatal and intrapartum deaths.
  @ValidateIf(
    (dto) =>
      dto.deathPeriod === PregnancyPeriod.ANTENATAL ||
      dto.deathPeriod === PregnancyPeriod.INTRAPARTUM,
  )
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(45)
  gestationAtDeath?: number;

  // Required for postpartum deaths.
  @ValidateIf((dto) => dto.deathPeriod === PregnancyPeriod.POSTPARTUM)
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(42)
  daysPostpartum?: number;
}
