import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BiodataController } from './biodata.controller';
import { BIODATA_SERVICE_CLIENT } from './biodata.constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: BIODATA_SERVICE_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('BIODATA_SERVICE_HOST') ?? '127.0.0.1',
            port: Number(config.get<string>('BIODATA_SERVICE_PORT') ?? 3001),
          },
        }),
      },
    ]),
  ],
  controllers: [BiodataController],
})
export class BiodataModule {}
