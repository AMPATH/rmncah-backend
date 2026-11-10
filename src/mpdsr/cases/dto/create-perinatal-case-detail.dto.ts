import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

import { DeliveryMode } from '../enums/case.enum.js';

export class CreatePerinatalCaseDetailDto {
  @IsDateString()
  dateOfDeath: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(45)
  gestationalAgeAtBirth?: number;

  @IsEnum(DeliveryMode)
  modeOfDelivery: DeliveryMode;

  @IsUUID()
  causeOfDeathId: string;

  @IsString()
  @IsNotEmpty()
  clinicalSummary: string;
}
