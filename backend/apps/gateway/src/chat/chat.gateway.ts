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

type AuthedSocket = Socket & {
  data: { phoneNumber?: string; fullName?: string; joinedRooms?: Set<string> };
};

type MessageRef = { roomId: string; messageId: string };

/// Real-time layer for both chat types (1:1 DMs and per-profession-category
/// group chats) - they're just different room id strings, so one gateway
/// handles both. Auth happens once at connection time (a JWT the same as
/// the REST API's, passed in the socket handshake) rather than per-message,
/// since a socket connection is inherently already "logged in" once verified.
///
/// Server -> client events: history, message, messageUpdated, typing, read,
/// chatError, inbox. Anything that changes an existing message (reactions, edits,
/// deletes, poll votes) is re-broadcast whole as `messageUpdated`.
///
/// `inbox` ({ roomId }) tells an app that one of its chats has a new message,
/// so its chat list and unread badges update without waiting for a refresh.
/// It goes to the `user::<phone>` room every socket joins on connect (for
/// DMs), and to `watch::<roomId>` rooms an app joins via `watch` (for its
/// profession group chat).
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
      await socket.join(ChatGateway.userRoom(payload.sub));
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: AuthedSocket) {
    this.logger.debug(`Socket disconnected: ${socket.data.phoneNumber ?? 'unknown'}`);
    // The app drops its socket when a chat screen closes, so this is when
    // messages that arrived while the chat was open become "read".
    for (const roomId of socket.data.joinedRooms ?? []) {
      this.markRead(socket, roomId);
    }
  }

  @SubscribeMessage('join')
  async onJoin(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    await socket.join(data.roomId);
    (socket.data.joinedRooms ??= new Set()).add(data.roomId);
    await this.markRead(socket, data.roomId);
    try {
      const [messages, reads] = await Promise.all([
        firstValueFrom(this.client.send(CHAT_TCP_PATTERNS.HISTORY, { roomId: data.roomId })),
        firstValueFrom(this.client.send(CHAT_TCP_PATTERNS.ROOM_READS, { roomId: data.roomId })),
      ]);
      socket.emit('history', { roomId: data.roomId, messages, reads });
    } catch (err) {
      this.emitError(socket, err);
    }
  }

  /// The app's inbox connection asks for `inbox` events about these group
  /// chats. Only the room id is ever sent, never message content.
  @SubscribeMessage('watch')
  async onWatch(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { roomIds?: string[] },
  ) {
    const roomIds = (Array.isArray(data?.roomIds) ? data.roomIds : [])
      .filter((id): id is string => typeof id === 'string' && id.startsWith('cat::'))
      .slice(0, 20);
    if (roomIds.length) await socket.join(roomIds.map((id) => ChatGateway.watchRoom(id)));
  }

  @SubscribeMessage('leave')
  async onLeave(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    await socket.leave(data.roomId);
    socket.data.joinedRooms?.delete(data.roomId);
    this.markRead(socket, data.roomId);
  }

  @SubscribeMessage('message')
  async onMessage(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody()
    data: {
      roomId: string;
      senderName?: string;
      type?: string;
      text?: string;
      attachment?: Record<string, unknown>;
      replyToId?: string;
      poll?: { question?: string; options?: string[]; allowMultiple?: boolean };
    },
  ) {
    const senderPhone = socket.data.phoneNumber;
    if (!senderPhone || !data?.roomId) return;

    try {
      const saved = await firstValueFrom(
        this.client.send(CHAT_TCP_PATTERNS.SEND, {
          roomId: data.roomId,
          senderPhone,
          senderName: data.senderName,
          type: data.type ?? 'text',
          text: data.text,
          attachment: data.attachment,
          replyToId: data.replyToId,
          poll: data.poll,
        }),
      );
      this.server.to(data.roomId).emit('message', saved);
      this.server.to(data.roomId).emit('typing', {
        roomId: data.roomId,
        phoneNumber: senderPhone,
        isTyping: false,
      });
      this.notifyInbox(data.roomId);

      // Push-notify everyone else, except people looking at this chat now.
      const viewers = await this.server.in(data.roomId).fetchSockets();
      const excludePhones = viewers
        .map((s) => (s.data as AuthedSocket['data']).phoneNumber)
        .filter((p): p is string => !!p);
      this.client.emit(CHAT_TCP_PATTERNS.NOTIFY, {
        messageId: String((saved as { _id: unknown })._id),
        excludePhones,
      });
    } catch (err) {
      this.emitError(socket, err);
    }
  }

  @SubscribeMessage('react')
  onReact(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: MessageRef & { emoji?: string | null; name?: string },
  ) {
    return this.updateMessage(socket, CHAT_TCP_PATTERNS.REACT, data, {
      emoji: data?.emoji ?? null,
      name: data?.name,
    });
  }

  @SubscribeMessage('edit')
  onEdit(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: MessageRef & { text: string },
  ) {
    return this.updateMessage(socket, CHAT_TCP_PATTERNS.EDIT, data, { text: data?.text });
  }

  @SubscribeMessage('delete')
  onDelete(@ConnectedSocket() socket: AuthedSocket, @MessageBody() data: MessageRef) {
    return this.updateMessage(socket, CHAT_TCP_PATTERNS.DELETE, data, {});
  }

  @SubscribeMessage('vote')
  onVote(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: MessageRef & { optionIds: string[] },
  ) {
    return this.updateMessage(socket, CHAT_TCP_PATTERNS.VOTE, data, {
      optionIds: Array.isArray(data?.optionIds) ? data.optionIds : [],
    });
  }

  /// Relayed to everyone else in the room; nothing is stored.
  @SubscribeMessage('typing')
  onTyping(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean; name?: string },
  ) {
    if (!socket.data.phoneNumber || !socket.data.joinedRooms?.has(data?.roomId)) return;
    socket.to(data.roomId).emit('typing', {
      roomId: data.roomId,
      phoneNumber: socket.data.phoneNumber,
      name: data.name,
      isTyping: !!data.isTyping,
    });
  }

  /// Sent by the app when a message arrives while the chat is on screen, so
  /// read receipts update live rather than only when the chat is closed.
  @SubscribeMessage('read')
  onRead(@ConnectedSocket() socket: AuthedSocket, @MessageBody() data: { roomId: string }) {
    if (!socket.data.joinedRooms?.has(data?.roomId)) return;
    return this.markRead(socket, data.roomId);
  }

  private async updateMessage(
    socket: AuthedSocket,
    pattern: string,
    ref: MessageRef,
    extra: Record<string, unknown>,
  ) {
    const phoneNumber = socket.data.phoneNumber;
    // Only people who have the chat open (and so could see the message) may
    // change it; the service also checks the message belongs to that room.
    if (!phoneNumber || !ref?.messageId || !socket.data.joinedRooms?.has(ref.roomId)) return;
    try {
      const updated = await firstValueFrom(
        this.client.send(pattern, {
          roomId: ref.roomId,
          messageId: ref.messageId,
          phoneNumber,
          ...extra,
        }),
      );
      this.server.to(ref.roomId).emit('messageUpdated', updated);
    } catch (err) {
      this.emitError(socket, err);
    }
  }

  private static userRoom(phoneNumber: string) {
    return `user::${phoneNumber}`;
  }

  private static watchRoom(roomId: string) {
    return `watch::${roomId}`;
  }

  private notifyInbox(roomId: string) {
    const targets = roomId.startsWith('dm::')
      ? roomId.split('::').slice(1).map((phone) => ChatGateway.userRoom(phone))
      : [ChatGateway.watchRoom(roomId)];
    this.server.to(targets).emit('inbox', { roomId });
  }

  private async markRead(socket: AuthedSocket, roomId: string) {
    const phoneNumber = socket.data.phoneNumber;
    if (!phoneNumber) return;
    try {
      const read = await firstValueFrom(
        this.client.send(CHAT_TCP_PATTERNS.MARK_READ, { phoneNumber, roomId }),
      );
      this.server.to(roomId).emit('read', read);
    } catch (err) {
      this.logger.warn(`markRead failed for ${roomId}: ${err}`);
    }
  }

  private emitError(socket: AuthedSocket, err: unknown) {
    const message = (err as { message?: unknown })?.message;
    socket.emit('chatError', {
      message: typeof message === 'string' ? message : 'Something went wrong. Please try again.',
    });
  }
}
