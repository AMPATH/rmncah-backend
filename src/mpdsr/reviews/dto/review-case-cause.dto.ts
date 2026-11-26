import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ReviewCaseCauseDto {
  @IsOptional()
  @IsUUID(undefined)
  causeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
