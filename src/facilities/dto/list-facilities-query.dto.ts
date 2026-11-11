import { IsBooleanString, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto.js';

import {
  FacilityLevel,
  FacilityType,
  FacilityOwnership,
} from '../enums/facility.enum.js';

export class ListFacilitiesQueryDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  subCountyId?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @IsOptional()
  @IsEnum(FacilityLevel)
  level?: FacilityLevel;

  @IsOptional()
  @IsEnum(FacilityType)
  type?: FacilityType;

  @IsOptional()
  @IsEnum(FacilityOwnership)
  ownership?: FacilityOwnership;
}
