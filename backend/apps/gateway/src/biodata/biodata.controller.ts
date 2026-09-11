import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { BIODATA_TCP_PATTERNS, CreateBiodataDto } from '@app/shared';
import { BIODATA_SERVICE_CLIENT } from '../clients/backend-client.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthedRequest = Request & { user?: { sub: string } };

@Controller('biodata')
export class BiodataController {
  constructor(
    @Inject(BIODATA_SERVICE_CLIENT) private readonly client: ClientProxy,
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
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/(jpg|jpeg|png)$/i)) {
          return callback(
            new Error('Only jpg, jpeg, and png image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Req() req: AuthedRequest,
    @Body() dto: CreateBiodataDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // The phone number is the link between a login and a biodata record, so
    // it always comes from the verified token - never from client input -
    // otherwise someone could submit (or overwrite) biodata under a phone
    // number that isn't theirs.
    dto.phoneNumber = req.user!.sub;
    const imageUrl = file ? `/uploads/${file.filename}` : undefined;
    return firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.CREATE, { ...dto, imageUrl }),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: AuthedRequest) {
    return firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.FIND_BY_PHONE, {
        phoneNumber: req.user!.sub,
      }),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.FIND_ALL, {}),
    );
  }
}
