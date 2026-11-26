import { ApiProperty } from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../../common/dto/api-success-response.dto.js';

export class MessageDataResponseDto {
  @ApiProperty({
    description: 'Operation result message.',
    example: 'Operation completed successfully.',
  })
  message: string;
}

export class MessageResponseDto extends ApiSuccessResponseDto {
  @ApiProperty({ type: MessageDataResponseDto })
  data: MessageDataResponseDto;
}
