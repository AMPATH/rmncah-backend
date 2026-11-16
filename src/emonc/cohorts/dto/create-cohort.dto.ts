
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateCohortDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsUUID()
  facilityId: string;

  @IsUUID()
  mentorId: string;

  // Dates can be omitted for a draft cohort.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  startDate?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  endDate?: string | null;
}
