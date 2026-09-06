import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthUserDocument = AuthUser & Document;

@Schema({ timestamps: true })
export class AuthUser {
  @Prop({ required: true, unique: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true })
  pinHash: string;

  @Prop({ trim: true })
  fullName?: string;
}

export const AuthUserSchema = SchemaFactory.createForClass(AuthUser);
