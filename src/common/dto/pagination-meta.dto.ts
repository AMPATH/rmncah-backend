import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of records matching the query.',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number.',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Maximum number of records per page.',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages available.',
    example: 8,
  })
  totalPages: number;
}
