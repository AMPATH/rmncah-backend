import {
  ArrayUnique,
  IsArray,
  IsUUID,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  IsNotFutureDate,
  IsSameOrAfterDate,
} from './validators/date.validators.js';

export class UpdateCaseDto {
  @IsOptional()
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfBirth?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  @IsSameOrAfterDate('dateOfBirth')
  notificationDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  comments?: string;

  // IDs selected from the seeded contributing-factor catalogue.
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  contributingFactorIds?: string[];


  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
