import { Type } from 'class-transformer';

import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { CaseType, ReportingSetting } from '../enums/case.enum.js';

export class ListCasesQueryDto {
  // Filtering
  @IsOptional()
  @IsEnum(CaseType)
  caseType?: CaseType;

  @IsOptional()
  @IsEnum(ReportingSetting)
  reportingSetting?: ReportingSetting;

  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsUUID()
  communityUnitId?: string;

  @IsOptional()
  @IsUUID()
  reportedBy?: string;

  // Date range filtering (notification date)
  @IsOptional()
  @IsDateString({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  toDate?: string;

  // Search
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // Sorting
  @IsOptional()
  @IsIn([
    'createdAt',
    'updatedAt',
    'notificationDate',
    'dateOfBirth',
    'caseNumber',
  ])
  sortBy = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
