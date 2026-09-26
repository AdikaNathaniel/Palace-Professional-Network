import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

export const CHAT_MESSAGE_TYPES = ['text', 'image', 'file', 'voice', 'sticker', 'poll'] as const;
export type ChatMessageType = (typeof CHAT_MESSAGE_TYPES)[number];

@Schema({ _id: false })
export class ChatAttachment {
  @Prop({ required: true })
  url: string;

  @Prop()
  name?: string;

  @Prop()
  mimeType?: string;

  @Prop()
  size?: number;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  durationMs?: number;
}

@Schema({ _id: false })
export class ChatReplyPreview {
  @Prop({ required: true })
  messageId: string;

  @Prop()
  senderPhone?: string;

  @Prop()
  senderName?: string;

  @Prop()
  type?: string;

  /// Short excerpt of the quoted message, copied at send time so the quote
  /// still renders if the original is later edited or deleted.
  @Prop()
  text?: string;
}

@Schema({ _id: false })
export class ChatReaction {
  @Prop({ required: true })
  phone: string;

  @Prop()
  name?: string;

  @Prop({ required: true })
  emoji: string;
}

@Schema({ _id: false })
export class ChatPollOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  voters: string[];
}

@Schema({ _id: false })
export class ChatPoll {
  @Prop({ required: true })
  question: string;

  @Prop({ default: false })
  allowMultiple: boolean;

  @Prop({ type: [ChatPollOption], default: [] })
  options: ChatPollOption[];
}

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true, index: true })
  roomId: string;

  @Prop({ required: true })
  senderPhone: string;

  @Prop()
  senderName?: string;

  @Prop({ type: String, default: 'text', enum: CHAT_MESSAGE_TYPES })
  type: ChatMessageType;

  /// Always set, for every type: the message itself for text, a caption or a
  /// readable summary ("📷 Photo", "📊 POLL: ...") otherwise. App versions that
  /// predate rich messages only know this field, so it must stand alone.
  @Prop({ required: true })
  text: string;

  @Prop({ type: ChatAttachment })
  attachment?: ChatAttachment;

  @Prop({ type: ChatReplyPreview })
  replyTo?: ChatReplyPreview;

  @Prop({ type: [ChatReaction], default: [] })
  reactions: ChatReaction[];

  @Prop({ type: ChatPoll })
  poll?: ChatPoll;

  @Prop()
  editedAt?: Date;

  @Prop({ default: false })
  deleted: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ roomId: 1, createdAt: 1 });
