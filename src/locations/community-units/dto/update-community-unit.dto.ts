import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';

import { CreateCommunityUnitDto } from './create-community-unit.dto.js';

export class UpdateCommunityUnitDto extends PartialType(
  CreateCommunityUnitDto,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
