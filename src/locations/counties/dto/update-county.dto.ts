import { PartialType } from '@nestjs/mapped-types';
import { CreateCountyDto } from './create-county.dto.js';

export class UpdateCountyDto extends PartialType(CreateCountyDto) {}
