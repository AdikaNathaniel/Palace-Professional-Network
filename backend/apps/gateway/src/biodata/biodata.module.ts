import { Module } from '@nestjs/common';
import { BackendClientModule } from '../clients/backend-client.module';
import { BiodataController } from './biodata.controller';

@Module({
  imports: [BackendClientModule],
  controllers: [BiodataController],
})
export class BiodataModule {}
