import { IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[0-9+\s-]{7,20}$/, { message: 'Enter a valid phone number' })
  phoneNumber: string;

  @IsString()
  @Matches(/^[0-9]{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}
