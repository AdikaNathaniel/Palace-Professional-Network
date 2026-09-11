import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';
import { CHAT_TCP_PATTERNS } from '@app/shared';
import { BIODATA_SERVICE_CLIENT } from '../clients/backend-client.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthedRequest = Request & { user?: { sub: string } };

@Controller('chat')
export class ChatController {
  constructor(
    @Inject(BIODATA_SERVICE_CLIENT) private readonly client: ClientProxy,
  ) {}

  @Get('dm-rooms')
  @UseGuards(JwtAuthGuard)
  myDmRooms(@Req() req: AuthedRequest) {
    return firstValueFrom(
      this.client.send(CHAT_TCP_PATTERNS.MY_DM_ROOMS, {
        phoneNumber: req.user!.sub,
      }),
    );
  }
}
