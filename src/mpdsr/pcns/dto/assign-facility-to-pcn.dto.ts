import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignFacilityToPcnDto {
  @IsUUID()
  @IsNotEmpty()
  facilityId: string;

  @IsUUID()
  @IsNotEmpty()
  pcnId: string;
}
