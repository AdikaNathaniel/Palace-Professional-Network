import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_TCP_PATTERNS, ChangePinDto, LoginDto, RegisterDto } from '@app/shared';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_TCP_PATTERNS.REGISTER)
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern(AUTH_TCP_PATTERNS.LOGIN)
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern(AUTH_TCP_PATTERNS.CHANGE_PIN)
  changePin(@Payload() data: ChangePinDto & { phoneNumber: string }) {
    const { phoneNumber, ...dto } = data;
    return this.authService.changePin(phoneNumber, dto);
  }
}
