import { PartialType } from '@nestjs/mapped-types';

import { CreateCaseDto } from './create-case.dto.js';

export class UpdateCaseDto extends PartialType(CreateCaseDto) {}
