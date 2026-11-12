import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCountyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  @Matches(/^\d{3}$/, {
    message: 'County code must be a 3-digit number',
  })
  code: string;
}
