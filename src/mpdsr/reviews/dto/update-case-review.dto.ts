import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateCaseReviewDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  contributingFactorIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewerNotes?: string;
}
