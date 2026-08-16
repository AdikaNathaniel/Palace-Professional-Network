import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BiodataController } from './biodata.controller';
import { BiodataService } from './biodata.service';
import { Biodata, BiodataSchema } from '../schemas/biodata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Biodata.name, schema: BiodataSchema }]),
  ],
  controllers: [BiodataController],
  providers: [BiodataService],
})
export class BiodataModule {}
