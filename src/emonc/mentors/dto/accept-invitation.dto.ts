
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'Invitation token must be a valid hexadecimal token',
  })
  invitationToken: string;
}
