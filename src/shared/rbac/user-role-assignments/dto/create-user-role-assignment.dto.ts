import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateUserRoleAssignmentDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  @IsUUID('4')
  @IsNotEmpty()
  roleId: string;

  @IsOptional()
  @IsUUID('4')
  organizationAssignmentId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
