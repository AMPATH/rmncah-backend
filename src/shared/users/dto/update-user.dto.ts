
import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsEnum,
  IsOptional,
} from 'class-validator';

import { CreateUserDto } from './create-user.dto.js';
import {AccountStatus } from '../entities/user.entity.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @IsOptional()
  @IsEmail()
  email?: string;
  
}
