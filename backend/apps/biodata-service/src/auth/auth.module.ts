import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthUser, AuthUserSchema } from '../schemas/auth-user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuthUser.name, schema: AuthUserSchema }]),
    // No `imports: [ConfigModule]` here - ConfigModule is already global
    // (see AppModule's ConfigModule.forRoot({ isGlobal: true })), so
    // ConfigService is injectable without re-declaring it.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
