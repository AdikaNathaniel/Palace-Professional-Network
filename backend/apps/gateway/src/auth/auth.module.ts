import { Module } from '@nestjs/common';
import { BackendClientModule } from '../clients/backend-client.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [BackendClientModule],
  controllers: [AuthController],
})
export class AuthModule {}
