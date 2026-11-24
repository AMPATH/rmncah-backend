import { ApiProperty } from '@nestjs/swagger';

export class Icd11CauseResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the ICD-11 cause.',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'ICD-11 cause code.',
    example: 'JA00',
  })
  code: string;

  @ApiProperty({
    description: 'Description of the ICD-11 cause.',
    example: 'Abortion',
  })
  description: string;

  @ApiProperty({
    description: 'Date when the cause record was created.',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the cause record was last updated.',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}
