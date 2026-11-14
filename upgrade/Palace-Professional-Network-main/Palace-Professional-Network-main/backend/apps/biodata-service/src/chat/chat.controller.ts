import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CHAT_TCP_PATTERNS } from '@app/shared';
import { ChatService } from './chat.service';
import type { SendMessageInput } from './chat.service';
import { PushService } from './push.service';

type RoomMessageRef = { roomId: string; messageId: string; phoneNumber: string };

@Controller()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly pushService: PushService,
  ) {}

  @MessagePattern(CHAT_TCP_PATTERNS.SEND)
  send(@Payload() data: SendMessageInput) {
    return this.chatService.sendMessage(data);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.HISTORY)
  history(@Payload() data: { roomId: string }) {
    return this.chatService.getHistory(data.roomId);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.MY_DM_ROOMS)
  myDmRooms(@Payload() data: { phoneNumber: string }) {
    return this.chatService.getMyDmRooms(data.phoneNumber);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.MARK_READ)
  markRead(@Payload() data: { phoneNumber: string; roomId: string }) {
    return this.chatService.markRead(data.phoneNumber, data.roomId);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.UNREAD_COUNTS)
  unreadCounts(@Payload() data: { phoneNumber: string }) {
    return this.chatService.getUnreadCounts(data.phoneNumber);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.ROOM_READS)
  roomReads(@Payload() data: { roomId: string }) {
    return this.chatService.getRoomReads(data.roomId);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.REACT)
  react(@Payload() data: RoomMessageRef & { name?: string; emoji?: string | null }) {
    return this.chatService.react(data.roomId, data.messageId, data.phoneNumber, data.name, data.emoji);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.EDIT)
  edit(@Payload() data: RoomMessageRef & { text: string }) {
    return this.chatService.edit(data.roomId, data.messageId, data.phoneNumber, data.text);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.DELETE)
  delete(@Payload() data: RoomMessageRef) {
    return this.chatService.delete(data.roomId, data.messageId, data.phoneNumber);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.VOTE)
  vote(@Payload() data: RoomMessageRef & { optionIds: string[] }) {
    return this.chatService.vote(data.roomId, data.messageId, data.phoneNumber, data.optionIds);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.PRESENCE)
  presence(@Payload() data: { phoneNumber: string }) {
    return this.chatService.getPresence(data.phoneNumber);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.REGISTER_DEVICE)
  registerDevice(@Payload() data: { phoneNumber: string; token: string }) {
    return this.chatService.registerDevice(data.phoneNumber, data.token);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.UNREGISTER_DEVICE)
  unregisterDevice(@Payload() data: { phoneNumber: string; token: string }) {
    return this.chatService.unregisterDevice(data.phoneNumber, data.token);
  }

  @EventPattern(CHAT_TCP_PATTERNS.NOTIFY)
  notify(@Payload() data: { messageId: string; excludePhones?: string[] }) {
    return this.pushService.notifyNewMessage(data.messageId, data.excludePhones);
  }
}
