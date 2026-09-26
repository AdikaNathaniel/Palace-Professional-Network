import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PushService } from './push.service';
import { ChatMessage, ChatMessageSchema } from '../schemas/chat-message.schema';
import { Biodata, BiodataSchema } from '../schemas/biodata.schema';
import { ChatRead, ChatReadSchema } from '../schemas/chat-read.schema';
import { AuthUser, AuthUserSchema } from '../schemas/auth-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: Biodata.name, schema: BiodataSchema },
      { name: ChatRead.name, schema: ChatReadSchema },
      { name: AuthUser.name, schema: AuthUserSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, PushService],
})
export class ChatModule {}
