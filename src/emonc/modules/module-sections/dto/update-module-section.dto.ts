import { PartialType } from '@nestjs/mapped-types';
import { CreateModuleSectionDto } from './create-module-section.dto.js';

export class UpdateModuleSectionDto extends PartialType(CreateModuleSectionDto) {}
