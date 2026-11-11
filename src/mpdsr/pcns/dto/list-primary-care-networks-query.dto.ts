import { IsBooleanString, IsOptional, IsUUID } from 'class-validator';

import { ListQueryDto } from '../../../common/dto/list-query.dto.js';

export class ListPrimaryCareNetworksQueryDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  subCountyId?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
