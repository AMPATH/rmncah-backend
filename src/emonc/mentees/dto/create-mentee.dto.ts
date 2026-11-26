
import {
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

import { CreateUserDto } from '../../../shared/users/dto/create-user.dto.js';

export class CreateMenteeDto extends CreateUserDto {
  @IsUUID('4')
  @IsNotEmpty()
  facilityId: string;
}
