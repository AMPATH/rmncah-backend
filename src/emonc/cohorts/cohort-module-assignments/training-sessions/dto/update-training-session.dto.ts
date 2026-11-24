
import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingSessionDto } from './create-training-session.dto.js';

export class UpdateTrainingSessionDto extends PartialType(
  CreateTrainingSessionDto,
) {}
