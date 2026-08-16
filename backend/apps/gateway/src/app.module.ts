import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BiodataModule } from './biodata/biodata.module';

// Matches the multer diskStorage destination in biodata.controller.ts, which
// is also resolved relative to process.cwd() (the backend/ project root).
const UPLOADS_ROOT = join(process.cwd(), 'uploads');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: UPLOADS_ROOT,
      serveRoot: '/uploads',
    }),
    BiodataModule,
  ],
})
export class AppModule {}
