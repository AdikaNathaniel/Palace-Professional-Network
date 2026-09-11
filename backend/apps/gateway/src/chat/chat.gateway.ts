import { Inject, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { Server, Socket } from 'socket.io';
import { CHAT_TCP_PATTERNS } from '@app/shared';
import { BIODATA_SERVICE_CLIENT } from '../clients/backend-client.constants';

type AuthedSocket = Socket & { data: { phoneNumber?: string; fullName?: string } };

/// Real-time layer for both chat types (1:1 DMs and per-profession-category
/// group chats) - they're just different room id strings, so one gateway
/// handles both. Auth happens once at connection time (a JWT the same as
/// the REST API's, passed in the socket handshake) rather than per-message,
/// since a socket connection is inherently already "logged in" once verified.
@WebSocketGateway({ cors: { origin: '*' } })
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(BIODATA_SERVICE_CLIENT) private readonly client: ClientProxy,
  ) {}

  async handleConnection(socket: AuthedSocket) {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);

    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      socket.data.phoneNumber = payload.sub;
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: AuthedSocket) {
    this.logger.debug(`Socket disconnected: ${socket.data.phoneNumber ?? 'unknown'}`);
  }

  @SubscribeMessage('join')
  async onJoin(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    await socket.join(data.roomId);
    const history = await firstValueFrom(
      this.client.send(CHAT_TCP_PATTERNS.HISTORY, { roomId: data.roomId }),
    );
    socket.emit('history', { roomId: data.roomId, messages: history });
  }

  @SubscribeMessage('leave')
  async onLeave(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    await socket.leave(data.roomId);
  }

  @SubscribeMessage('message')
  async onMessage(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { roomId: string; text: string; senderName?: string },
  ) {
    const senderPhone = socket.data.phoneNumber;
    if (!senderPhone || !data.text?.trim()) return;

    const saved = await firstValueFrom(
      this.client.send(CHAT_TCP_PATTERNS.SEND, {
        roomId: data.roomId,
        senderPhone,
        senderName: data.senderName,
        text: data.text.trim(),
      }),
    );
    this.server.to(data.roomId).emit('message', saved);
  }
}
