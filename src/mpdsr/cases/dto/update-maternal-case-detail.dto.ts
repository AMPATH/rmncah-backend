import { PartialType } from '@nestjs/mapped-types';
import { CreateMaternalCaseDetailDto } from './create-maternal-case-detail.dto.js';

export class UpdateMaternalCaseDetailDto extends PartialType(
  CreateMaternalCaseDetailDto,
) {}
