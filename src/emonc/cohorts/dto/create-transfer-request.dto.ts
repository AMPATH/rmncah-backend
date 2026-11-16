
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { CohortTransferReason } from '../enum/cohorts.enum.js';

export class CreateTransferRequestDto {
  @IsOptional()
  @IsUUID()
  requestedCohortId?: string;

  @IsEnum(CohortTransferReason)
  reason: CohortTransferReason;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;
}
