import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { ChangePinDto, LoginDto, RegisterDto } from '@app/shared';
import { AuthUser, AuthUserDocument } from '../schemas/auth-user.schema';

const INVALID_CREDENTIALS = 'Invalid phone number or PIN.';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AuthUser.name) private authUserModel: Model<AuthUserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.authUserModel.findOne({
      phoneNumber: dto.phoneNumber,
    });
    if (existing) {
      throw new RpcException({
        status: 409,
        message: 'This phone number is already registered.',
      });
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);
    const created = new this.authUserModel({
      phoneNumber: dto.phoneNumber,
      pinHash,
      fullName: dto.fullName,
    });
    await created.save();

    return this.buildSession(created.phoneNumber, created.fullName);
  }

  async login(dto: LoginDto) {
    const user = await this.authUserModel.findOne({
      phoneNumber: dto.phoneNumber,
    });
    if (!user) {
      throw new RpcException({ status: 401, message: INVALID_CREDENTIALS });
    }

    const valid = await bcrypt.compare(dto.pin, user.pinHash);
    if (!valid) {
      throw new RpcException({ status: 401, message: INVALID_CREDENTIALS });
    }

    return this.buildSession(user.phoneNumber, user.fullName);
  }

  async changePin(phoneNumber: string, dto: ChangePinDto) {
    const user = await this.authUserModel.findOne({ phoneNumber });
    if (!user) {
      throw new RpcException({ status: 404, message: 'Account not found.' });
    }

    const valid = await bcrypt.compare(dto.currentPin, user.pinHash);
    if (!valid) {
      throw new RpcException({ status: 401, message: 'Current PIN is incorrect.' });
    }

    user.pinHash = await bcrypt.hash(dto.newPin, 10);
    await user.save();

    return { success: true };
  }

  private buildSession(phoneNumber: string, fullName?: string) {
    const token = this.jwtService.sign({ sub: phoneNumber });
    return { phoneNumber, fullName, token };
  }
}
