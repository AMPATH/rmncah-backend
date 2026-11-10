import { PartialType } from '@nestjs/mapped-types';

import { CreateNearMissCaseDetailDto } from './create-near-miss-case-detail.dto.js';

export class UpdateNearMissCaseDetailDto extends PartialType(
  CreateNearMissCaseDetailDto,
) {}
