import { IsBooleanString, IsOptional, IsUUID } from 'class-validator';

import { ListQueryDto } from '../../../common/dto/list-query.dto.js';

export class ListCommunityUnitsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}
