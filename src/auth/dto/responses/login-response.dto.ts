import { ApiProperty } from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../../common/dto/api-success-response.dto.js';
import { AccountStatus } from '../../../shared/users/enum/users.enum.js';


class LoginUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Ian' })
  firstName: string;

  @ApiProperty({ example: 'Koech' })
  lastName: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @ApiProperty({ example: false })
  mustChangePassword: boolean;
}

export class LoginDataResponseDto {
  @ApiProperty({ example: 'access-token-value' })
  accessToken: string;

  @ApiProperty({ example: 'refresh-token-value' })
  refreshToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ type: LoginUserResponseDto })
  user: LoginUserResponseDto;
}

export class LoginResponseDto extends ApiSuccessResponseDto {
  @ApiProperty({ type: LoginDataResponseDto })
  data: LoginDataResponseDto;
}
