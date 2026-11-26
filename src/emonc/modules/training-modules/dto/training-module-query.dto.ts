
import { Type } from 'class-transformer';

import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { TrainingModuleStatus } from '../enum/training-module-status.enum.js';

export class TrainingModuleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsEnum(TrainingModuleStatus)
  status?: TrainingModuleStatus;
}
