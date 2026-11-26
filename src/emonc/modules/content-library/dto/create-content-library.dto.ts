
import { Transform } from 'class-transformer';

import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { LearningMaterialType } from '../../learning-materials/enums/learning-material-type.enum.js';

export class CreateContentLibraryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) => String(value).trim())
  title: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  description?: string;

  @IsEnum(LearningMaterialType)
  @Transform(({ value }) => String(value).trim().toUpperCase())
  type: LearningMaterialType;

  // Required for VIDEO resources
  @ValidateIf((dto) => dto.type === LearningMaterialType.VIDEO)
  @IsUrl()
  @IsNotEmpty()
  externalUrl?: string;
}
