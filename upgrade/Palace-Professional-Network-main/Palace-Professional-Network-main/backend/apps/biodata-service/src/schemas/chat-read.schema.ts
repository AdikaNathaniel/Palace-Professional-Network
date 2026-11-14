import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatReadDocument = ChatRead & Document;

/// When a user last had a room open. Messages from other people created
/// after lastReadAt count as unread for that user in that room.
@Schema({ timestamps: true })
export class ChatRead {
  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  roomId: string;

  @Prop({ required: true })
  lastReadAt: Date;
}

export const ChatReadSchema = SchemaFactory.createForClass(ChatRead);
ChatReadSchema.index({ phoneNumber: 1, roomId: 1 }, { unique: true });
