import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthUser, AuthUserSchema } from '../schemas/auth-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuthUser.name, schema: AuthUserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
