import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';

import { CreatePrimaryCareNetworkDto } from './create-pcn.dto.js';

export class UpdatePrimaryCareNetworkDto extends PartialType(
  CreatePrimaryCareNetworkDto,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
