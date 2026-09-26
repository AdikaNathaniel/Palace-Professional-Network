import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import { CHAT_TCP_PATTERNS } from '@app/shared';
import { BIODATA_SERVICE_CLIENT } from '../clients/backend-client.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatMediaService } from './chat-media.service';

type AuthedRequest = Request & { user?: { sub: string } };

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    @Inject(BIODATA_SERVICE_CLIENT) private readonly client: ClientProxy,
    private readonly media: ChatMediaService,
  ) {}

  @Get('dm-rooms')
  myDmRooms(@Req() req: AuthedRequest) {
    return this.send(CHAT_TCP_PATTERNS.MY_DM_ROOMS, { phoneNumber: req.user!.sub });
  }

  /// { total, rooms: { [roomId]: count } } - drives the unread badges.
  @Get('unread')
  unreadCounts(@Req() req: AuthedRequest) {
    return this.send(CHAT_TCP_PATTERNS.UNREAD_COUNTS, { phoneNumber: req.user!.sub });
  }

  /// { phoneNumber, lastSeenAt } - "online" / "last seen" in a DM header.
  @Get('presence/:phoneNumber')
  presence(@Param('phoneNumber') phoneNumber: string) {
    return this.send(CHAT_TCP_PATTERNS.PRESENCE, { phoneNumber });
  }

  /// Multipart field "file" (max 15 MB) -> { url, name, mimeType, size, ... }
  /// to attach to a chat message.
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new HttpException('No file was uploaded.', 400);
    return this.media.upload(file);
  }

  @Get('stickers')
  stickers(@Query('q') q = '', @Query('kind') kind = 'stickers') {
    return this.media.searchStickers(q, kind === 'gifs' ? 'gifs' : 'stickers');
  }

  @Post('device-token')
  registerDevice(@Req() req: AuthedRequest, @Body() body: { token?: string }) {
    return this.send(CHAT_TCP_PATTERNS.REGISTER_DEVICE, {
      phoneNumber: req.user!.sub,
      token: body?.token ?? '',
    });
  }

  @Delete('device-token')
  unregisterDevice(@Req() req: AuthedRequest, @Body() body: { token?: string }) {
    return this.send(CHAT_TCP_PATTERNS.UNREGISTER_DEVICE, {
      phoneNumber: req.user!.sub,
      token: body?.token ?? '',
    });
  }

  private async send(pattern: string, payload: unknown) {
    try {
      return await firstValueFrom(this.client.send(pattern, payload));
    } catch (err) {
      const rpcError = err as { status?: unknown; message?: unknown };
      throw new HttpException(
        typeof rpcError?.message === 'string' ? rpcError.message : 'Something went wrong.',
        typeof rpcError?.status === 'number' ? rpcError.status : 500,
      );
    }
  }
}
