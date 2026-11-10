import { IsDefined, IsObject, IsUUID } from 'class-validator';

import { CreateCaseDto } from './create-case.dto.js';

export class CreateCaseRequestDto extends CreateCaseDto {
  @IsUUID()
  reportedBy: string;

  @IsDefined()
  @IsObject()
  details: Record<string, unknown>;
}
