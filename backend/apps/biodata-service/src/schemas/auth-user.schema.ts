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

  /// Bumped by the app's periodic unread-count poll while it's open; drives
  /// "online" / "last seen" in chats.
  @Prop()
  lastSeenAt?: Date;

  /// Firebase Cloud Messaging tokens, one per signed-in device.
  @Prop({ type: [String], default: [] })
  fcmTokens: string[];
}

export const AuthUserSchema = SchemaFactory.createForClass(AuthUser);
