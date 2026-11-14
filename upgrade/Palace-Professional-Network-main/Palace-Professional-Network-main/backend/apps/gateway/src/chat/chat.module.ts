import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BackendClientModule } from '../clients/backend-client.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatMediaService } from './chat-media.service';

@Module({
  imports: [
    BackendClientModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [ChatController],
  providers: [JwtAuthGuard, ChatGateway, ChatMediaService],
})
export class ChatModule {}
