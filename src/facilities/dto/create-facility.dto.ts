import { Transform } from 'class-transformer';

import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  FacilityLevel,
  FacilityType,
  FacilityOwnership,
} from '../enums/facility.enum.js';

export class CreateFacilityDto {
  @IsUUID()
  @IsNotEmpty()
  subCountyId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  mflCode: string;

  @IsEnum(FacilityLevel)
  level: FacilityLevel;

  @IsEnum(FacilityType)
  type: FacilityType;

  @IsEnum(FacilityOwnership)
  ownership: FacilityOwnership;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
