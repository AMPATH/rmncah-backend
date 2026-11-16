
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { CohortTransferRequestStatus } from '../enum/cohorts.enum.js';

export class ReviewTransferRequestDto {
  @IsIn([
    CohortTransferRequestStatus.APPROVED,
    CohortTransferRequestStatus.REJECTED,
  ])
  status:
    | CohortTransferRequestStatus.APPROVED
    | CohortTransferRequestStatus.REJECTED;

  @IsOptional()
  @IsUUID()
  approvedCohortId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewComments?: string;
}
