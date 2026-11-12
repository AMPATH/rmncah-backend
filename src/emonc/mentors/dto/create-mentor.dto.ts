
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OrganizationLevel } from '../../../shared/users/entities/user.entity.js';
//import { OrganizationLevel } from '../../../shared/users/enum/users.enum.js';



export class CreateMentorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsUUID()
  cadreId?: string;

  @IsEnum(OrganizationLevel)
  level: OrganizationLevel;
}
