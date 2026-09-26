import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { memoryStorage } from 'multer';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import type { Request, Response } from 'express';
import { BIODATA_TCP_PATTERNS, CreateBiodataDto } from '@app/shared';
import { BIODATA_SERVICE_CLIENT } from '../clients/backend-client.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatMediaService } from '../chat/chat-media.service';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

type AuthedRequest = Request & { user?: { sub: string } };

@Controller('biodata')
export class BiodataController {
  constructor(
    @Inject(BIODATA_SERVICE_CLIENT) private readonly client: ClientProxy,
    private readonly media: ChatMediaService,
  ) {}

  @Get('options')
  getOptions() {
    return firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.OPTIONS, {}),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      // Accept by content type OR file extension: older app versions upload
      // without a content type (so it arrives as application/octet-stream).
      fileFilter: (req, file, callback) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!IMAGE_MIME_TYPES.includes(file.mimetype.toLowerCase()) && !IMAGE_EXTENSIONS.includes(ext)) {
          return callback(
            new BadRequestException('Only JPG, PNG and WEBP images are allowed.'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Req() req: AuthedRequest,
    @Body() dto: CreateBiodataDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // The phone number is the link between a login and a biodata record, so
    // it always comes from the verified token - never from client input -
    // otherwise someone could submit (or overwrite) biodata under a phone
    // number that isn't theirs.
    dto.phoneNumber = req.user!.sub;
    const imageUrl = file ? await this.storeProfileImage(file) : undefined;
    return firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.CREATE, { ...dto, imageUrl }),
    );
  }

  /// Cloudinary when configured (Render's disk is wiped on every restart);
  /// otherwise the local uploads folder served at /uploads.
  private async storeProfileImage(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    if (this.media.cloudinaryEnabled) {
      // Fix up a missing content type from the extension, or Cloudinary
      // would store the photo as a raw file rather than an image.
      const mimetype = IMAGE_MIME_TYPES.includes(file.mimetype.toLowerCase())
        ? file.mimetype
        : ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/jpeg';
      return (await this.media.upload({ ...file, mimetype }, 'palace-profiles')).url;
    }
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    await fs.mkdir('./uploads', { recursive: true });
    await fs.writeFile(join('./uploads', filename), file.buffer);
    return `/uploads/${filename}`;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMine(@Req() req: AuthedRequest, @Res() res: Response) {
    const record = await firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.FIND_BY_PHONE, {
        phoneNumber: req.user!.sub,
      }),
    );
    // Nest sends an empty body for a null return value, which the app's JSON
    // parser rejects ("Unexpected end of input") for members who haven't
    // submitted biodata yet. Always send valid JSON: the record, or `null`.
    res.json(record ?? null);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.FIND_ALL, {}),
    );
  }
}
