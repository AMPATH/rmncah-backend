import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddMenteeDto {
  @IsUUID()
  @IsNotEmpty()
  menteeId: string;
}