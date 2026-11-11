import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateSubCountyDto {
  @IsUUID()
  countyId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3,10}$/, {
    message: 'Sub-county code must contain exactly 3 or 4 digits',
  })
  code: string;
}
