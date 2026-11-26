import { ApiProperty } from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../../common/dto/api-success-response.dto.js';

export class RefreshTokenDataResponseDto {
  @ApiProperty({ example: 'new-access-token-value' })
  accessToken: string;

  @ApiProperty({ example: 'new-refresh-token-value' })
  refreshToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 900 })
  expiresIn: number;
}

export class RefreshTokenResponseDto extends ApiSuccessResponseDto {
  @ApiProperty({ type: RefreshTokenDataResponseDto })
  data: RefreshTokenDataResponseDto;
}
