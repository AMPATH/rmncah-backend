import { PartialType } from '@nestjs/mapped-types';

import { CreatePerinatalCaseDetailDto } from './create-perinatal-case-detail.dto.js';

export class UpdatePerinatalCaseDetailDto extends PartialType(
  CreatePerinatalCaseDetailDto,
) {}
