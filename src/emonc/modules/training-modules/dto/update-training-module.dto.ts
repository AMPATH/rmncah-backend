import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingModuleDto } from './create-training-module.dto.js';

export class UpdateTrainingModuleDto extends PartialType(CreateTrainingModuleDto) {}
