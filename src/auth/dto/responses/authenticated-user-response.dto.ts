import { ApiProperty } from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../../common/dto/api-success-response.dto.js';
import { AccountStatus } from '../../../shared/users/enum/users.enum.js';

export class AuthenticatedUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'session-uuid' })
  sessionId: string;

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

export class AuthenticatedUserApiResponseDto extends ApiSuccessResponseDto {
  @ApiProperty({ type: AuthenticatedUserResponseDto })
  data: AuthenticatedUserResponseDto;
}
