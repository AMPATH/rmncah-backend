
import { IsEnum } from 'class-validator';
import { TrainingSessionStatus } from '../enums/training-session-status.enum.js';

export class UpdateTrainingSessionStatusDto {
  @IsEnum(TrainingSessionStatus)
  status: TrainingSessionStatus;
}
