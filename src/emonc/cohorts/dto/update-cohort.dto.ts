import { PartialType } from '@nestjs/mapped-types';
import { CreateCohortDto } from './create-cohort.dto.js';

export class UpdateCohortDto extends PartialType(CreateCohortDto) {}
