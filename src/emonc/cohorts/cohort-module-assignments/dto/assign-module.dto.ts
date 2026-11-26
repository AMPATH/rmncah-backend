
import { IsUUID } from 'class-validator';

export class AssignModuleDto {
  @IsUUID()
  trainingModuleId: string;
}
