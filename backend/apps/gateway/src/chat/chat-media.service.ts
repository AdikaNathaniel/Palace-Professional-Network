import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadedAttachment {
  url: string;
  name: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface StickerResult {
  id: string;
  previewUrl: string;
  url: string;
  width: number;
  height: number;
}

/// Chat attachments go to Cloudinary (Render's disk is wiped on every
/// restart, so nothing durable can live there) and sticker/GIF search goes
/// through GIPHY with the key kept server-side. Each is disabled - returning
/// 503 with a readable message - until its env vars are set.
///
/// Cloudinary works in either of two modes:
///  - signed: CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
///  - unsigned: CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET (an upload
///    preset whose signing mode is "Unsigned"; no secret needed). The preset
///    name stays on the server, so the app can't be used to upload directly.
@Injectable()
export class ChatMediaService {
  private readonly cloudinaryReady: boolean;
  private readonly uploadPreset?: string;
  private readonly giphyKey?: string;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    const signed = !!(cloudName && apiKey && apiSecret);
    this.uploadPreset = signed
      ? undefined
      : config.get<string>('CLOUDINARY_UPLOAD_PRESET') || undefined;
    this.cloudinaryReady = signed || !!(cloudName && this.uploadPreset);
    if (this.cloudinaryReady) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey || undefined,
        api_secret: apiSecret || undefined,
        secure: true,
      });
    }
    this.giphyKey = config.get<string>('GIPHY_API_KEY') || undefined;
  }

  async upload(file: Express.Multer.File): Promise<UploadedAttachment> {
    if (!this.cloudinaryReady) {
      throw new HttpException(
        'Sharing photos and files is not set up yet.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    // Cloudinary files audio under "video"; anything that isn't an image or
    // audio goes as "raw" so documents (PDFs included) are delivered as-is.
    const resourceType = file.mimetype.startsWith('image/')
      ? 'image'
      : file.mimetype.startsWith('audio/')
        ? 'video'
        : 'raw';
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const done = (err?: unknown, res?: UploadApiResponse) =>
        err || !res ? reject(err ?? new Error('Upload failed')) : resolve(res);
      const stream = this.uploadPreset
        ? // Unsigned uploads only accept a few options; naming comes from the preset.
          cloudinary.uploader.unsigned_upload_stream(
            this.uploadPreset,
            { resource_type: resourceType, folder: 'palace-chat' },
            done,
          )
        : cloudinary.uploader.upload_stream(
            {
              folder: 'palace-chat',
              resource_type: resourceType,
              use_filename: resourceType === 'raw',
              unique_filename: true,
            },
            done,
          );
      stream.end(file.buffer);
    }).catch((err) => {
      throw new HttpException(`Upload failed: ${err?.message ?? err}`, HttpStatus.BAD_GATEWAY);
    });
    return {
      url: result.secure_url,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      width: result.width,
      height: result.height,
    };
  }

  async searchStickers(query: string, kind: 'stickers' | 'gifs'): Promise<StickerResult[]> {
    if (!this.giphyKey) {
      throw new HttpException('Stickers and GIFs are not set up yet.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const q = query.trim();
    const endpoint = q ? 'search' : 'trending';
    const params = new URLSearchParams({ api_key: this.giphyKey, limit: '30', rating: 'g' });
    if (q) params.set('q', q.slice(0, 50));
    const res = await fetch(`https://api.giphy.com/v1/${kind}/${endpoint}?${params}`);
    if (!res.ok) {
      throw new HttpException('Could not load stickers right now.', HttpStatus.BAD_GATEWAY);
    }
    type GiphyImage = { url: string; width: string; height: string };
    const body = (await res.json()) as {
      data: { id: string; images: { fixed_width: GiphyImage; fixed_width_small?: GiphyImage } }[];
    };
    return body.data
      .filter((g) => g.images?.fixed_width?.url)
      .map((g) => ({
        id: g.id,
        previewUrl: (g.images.fixed_width_small ?? g.images.fixed_width).url,
        url: g.images.fixed_width.url,
        width: Number(g.images.fixed_width.width),
        height: Number(g.images.fixed_width.height),
      }));
  }
}
