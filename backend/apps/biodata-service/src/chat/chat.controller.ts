import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CHAT_TCP_PATTERNS } from '@app/shared';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @MessagePattern(CHAT_TCP_PATTERNS.SEND)
  send(
    @Payload()
    data: { roomId: string; senderPhone: string; senderName?: string; text: string },
  ) {
    return this.chatService.sendMessage(
      data.roomId,
      data.senderPhone,
      data.senderName,
      data.text,
    );
  }

  @MessagePattern(CHAT_TCP_PATTERNS.HISTORY)
  history(@Payload() data: { roomId: string }) {
    return this.chatService.getHistory(data.roomId);
  }

  @MessagePattern(CHAT_TCP_PATTERNS.MY_DM_ROOMS)
  myDmRooms(@Payload() data: { phoneNumber: string }) {
    return this.chatService.getMyDmRooms(data.phoneNumber);
  }
}
