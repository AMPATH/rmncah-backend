
import {
  IsEmail,

  IsString,

  IsUUID,

  Matches,
} from 'class-validator';

export class VerifyMentorOtpDto {
      @IsUUID()
  invitationId: string;

 
    @IsString()
  @Matches(/^\d{6}$/, {
    message: 'OTP must contain exactly 6 digits',
  })
  otp: string;
}
