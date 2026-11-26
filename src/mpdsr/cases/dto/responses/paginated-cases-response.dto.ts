import { ApiProperty } from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../../../common/dto/api-success-response.dto.js';
import { CaseResponseDto } from './case-response.dto.js';

export class PaginatedCasesResponseDto extends ApiSuccessResponseDto {
  @ApiProperty({
    description: 'Cases returned for the current page.',
    type: () => [CaseResponseDto],
  })
  data: CaseResponseDto[];
}
