import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid refresh token used to obtain new authentication tokens.',
    example: 'refresh-token-placeholder',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
