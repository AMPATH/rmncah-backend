import { PartialType } from '@nestjs/mapped-types';
import { CreateSubCountyDto } from './create-sub-county.dto.js';

export class UpdateSubCountyDto extends PartialType(CreateSubCountyDto) {}
