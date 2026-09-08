import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BackendClientModule } from '../clients/backend-client.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BiodataController } from './biodata.controller';

@Module({
  imports: [
    BackendClientModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [BiodataController],
  providers: [JwtAuthGuard],
})
export class BiodataModule {}
