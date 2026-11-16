import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { OrganizationLevel } from '../enum/organization-level.enum.js';

export class CreateUserOrganizationAssignmentDto {
  @IsUUID()
  userId: string;

  @IsEnum(OrganizationLevel)
  level: OrganizationLevel;

  @IsOptional()
  @IsUUID()
  countyId?: string;

  @IsOptional()
  @IsUUID()
  subCountyId?: string;

  @IsOptional()
  @IsUUID()
  pcnId?: string;

  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsUUID()
  communityUnitId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
