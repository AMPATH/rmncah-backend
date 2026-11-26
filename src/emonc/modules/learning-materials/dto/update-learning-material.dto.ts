import { PartialType } from '@nestjs/mapped-types';
import { CreateLearningMaterialDto } from './create-learning-material.dto.js';

export class UpdateLearningMaterialDto extends PartialType(CreateLearningMaterialDto) {}
