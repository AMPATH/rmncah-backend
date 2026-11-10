import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  Max,
  MaxLength,
  ValidateIf,
  IsDefined,
} from 'class-validator';

import {
  PregnancyPeriod,
  PregnancyOutcome,
  DeliveryMode,
} from '../enums/case.enum.js';

import { IsNotFutureDate } from './validators/date.validators.js';

export class CreateMaternalCaseDetailDto {
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfDeath: string;

  @IsEnum(PregnancyPeriod)
  deathPeriod: PregnancyPeriod;

  @IsInt()
  @Min(0)
  parity: number;

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

  @ValidateIf((dto) => dto.deathPeriod === PregnancyPeriod.POSTPARTUM)
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(42)
  daysPostpartum?: number;

  @IsEnum(PregnancyOutcome)
  pregnancyOutcome: PregnancyOutcome;

  @IsEnum(DeliveryMode)
  deliveryMode: DeliveryMode;

  @IsUUID()
  causeOfDeathId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  clinicalSummary: string;
}
