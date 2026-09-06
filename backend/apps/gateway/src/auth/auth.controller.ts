import { Body, Controller, HttpException, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AUTH_TCP_PATTERNS, LoginDto, RegisterDto } from '@app/shared';
import { BIODATA_SERVICE_CLIENT } from '../clients/backend-client.constants';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(BIODATA_SERVICE_CLIENT) private readonly client: ClientProxy,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.send(AUTH_TCP_PATTERNS.REGISTER, dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.send(AUTH_TCP_PATTERNS.LOGIN, dto);
  }

  private async send(pattern: string, payload: unknown) {
    try {
      return await firstValueFrom(this.client.send(pattern, payload));
    } catch (err) {
      const rpcError = err as { status?: unknown; message?: unknown };
      const status =
        typeof rpcError?.status === 'number' ? rpcError.status : 500;
      const message =
        typeof rpcError?.message === 'string'
          ? rpcError.message
          : 'Something went wrong. Please try again.';
      throw new HttpException(message, status);
    }
  }
}
