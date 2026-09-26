import { IsString, Matches } from 'class-validator';

export class ChangePinDto {
  @IsString()
  @Matches(/^[0-9]{4}$/, { message: 'Current PIN must be exactly 4 digits' })
  currentPin: string;

  @IsString()
  @Matches(/^[0-9]{4}$/, { message: 'New PIN must be exactly 4 digits' })
  newPin: string;
}
