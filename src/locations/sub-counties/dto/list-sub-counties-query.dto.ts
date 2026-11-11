import { IsOptional, IsUUID } from 'class-validator';

import { ListQueryDto } from '../../../common/dto/list-query.dto.js';

export class ListSubCountiesQueryDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  countyId?: string;
}
