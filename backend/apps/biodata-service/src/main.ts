import { setServers } from 'dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

// On some hosts Node's built-in DNS resolver (used for the SRV/TXT lookups
// that `mongodb+srv://` needs) picks up a stale/local resolver (e.g. 127.0.0.1)
// instead of the network's real DNS server, even though the OS resolver works
// fine. Pointing it at public resolvers avoids that mismatch.
setServers(['8.8.8.8', '1.1.1.1']);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.BIODATA_SERVICE_HOST ?? '127.0.0.1',
        port: Number(process.env.BIODATA_SERVICE_PORT ?? 3001),
      },
    },
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen();
  // eslint-disable-next-line no-console
  console.log('Biodata microservice is listening (TCP)');
}
bootstrap();
