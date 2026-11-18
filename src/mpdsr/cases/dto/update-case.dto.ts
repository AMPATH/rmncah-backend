import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { ReportingSetting, Gender } from '../enums/case.enum.js';

import {
  IsNotFutureDate,
  IsSameOrAfterDate,
} from './validators/date.validators.js';

export class UpdateCaseDto {
  @IsOptional()
  @IsEnum(ReportingSetting)
  reportingSetting?: ReportingSetting;

  @ValidateIf((dto) => dto.facilityId !== undefined && dto.facilityId !== null)
  @IsUUID()
  facilityId?: string | null;

  @ValidateIf(
    (dto) => dto.communityUnitId !== undefined && dto.communityUnitId !== null,
  )
  @IsUUID()
  communityUnitId?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

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

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
