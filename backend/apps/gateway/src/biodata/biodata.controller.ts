import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BIODATA_TCP_PATTERNS, CreateBiodataDto } from '@app/shared';
import { BIODATA_SERVICE_CLIENT } from './biodata.constants';

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
    @Body() dto: CreateBiodataDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = file ? `/uploads/${file.filename}` : undefined;
    return firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.CREATE, { ...dto, imageUrl }),
    );
  }

  @Get()
  findAll() {
    return firstValueFrom(
      this.client.send(BIODATA_TCP_PATTERNS.FIND_ALL, {}),
    );
  }
}
