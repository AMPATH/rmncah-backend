
import { Transform, Type } from 'class-transformer';

import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import { LearningMaterialType } from '../enums/learning-material-type.enum.js';

export class CreateLearningMaterialDto {
  @Transform(({ value }) => String(value).trim())
  @IsUUID()
  moduleSectionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsEnum(LearningMaterialType)
  type: LearningMaterialType;

  // Required for VIDEO materials
  @ValidateIf((dto) => dto.type === LearningMaterialType.VIDEO)
  @IsUrl()
  @IsNotEmpty()
  externalUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  displayOrder?: number;
}
