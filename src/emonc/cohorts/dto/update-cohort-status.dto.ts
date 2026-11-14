import { IsIn } from 'class-validator';
import { CohortStatus } from '../enum/cohorts.enum.js';

export class UpdateCohortStatusDto {
  @IsIn([
    CohortStatus.ACTIVE,
    CohortStatus.COMPLETED,
    CohortStatus.CANCELLED,
  ])
  status:
    | CohortStatus.ACTIVE
    | CohortStatus.COMPLETED
    | CohortStatus.CANCELLED;
}