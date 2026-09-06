import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BIODATA_SERVICE_CLIENT } from './backend-client.constants';

const clientsModule = ClientsModule.registerAsync([
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
]);

// Shared by every gateway feature module (biodata, auth) that needs to talk
// to the biodata-service microservice, so they all reuse one TCP connection
// instead of each opening their own.
@Module({
  imports: [clientsModule],
  exports: [clientsModule],
})
export class BackendClientModule {}
