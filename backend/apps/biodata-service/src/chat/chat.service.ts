import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { CHAT_EDIT_WINDOW_MS, categoryRoomId } from '@app/shared';
import {
  CHAT_MESSAGE_TYPES,
  ChatAttachment,
  ChatMessage,
  ChatMessageDocument,
  ChatMessageType,
} from '../schemas/chat-message.schema';
import { Biodata, BiodataDocument } from '../schemas/biodata.schema';
import { ChatRead, ChatReadDocument } from '../schemas/chat-read.schema';
import { AuthUser, AuthUserDocument } from '../schemas/auth-user.schema';

const MAX_TEXT_LENGTH = 4000;
const MAX_POLL_OPTIONS = 12;
const DELETED_TEXT = 'This message was deleted';

export interface SendMessageInput {
  roomId: string;
  senderPhone: string;
  senderName?: string;
  type?: ChatMessageType;
  text?: string;
  attachment?: ChatAttachment;
  replyToId?: string;
  poll?: { question?: string; options?: string[]; allowMultiple?: boolean };
}

const fail = (status: number, message: string) => new RpcException({ status, message });

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessageDocument>,
    @InjectModel(Biodata.name) private biodataModel: Model<BiodataDocument>,
    @InjectModel(ChatRead.name) private chatReadModel: Model<ChatReadDocument>,
    @InjectModel(AuthUser.name) private authUserModel: Model<AuthUserDocument>,
  ) {}

  async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    const type: ChatMessageType = input.type ?? 'text';
    if (!CHAT_MESSAGE_TYPES.includes(type)) throw fail(400, 'Unknown message type.');
    const caption = (input.text ?? '').trim().slice(0, MAX_TEXT_LENGTH);

    const doc: Partial<ChatMessage> = {
      roomId: input.roomId,
      senderPhone: input.senderPhone,
      senderName: input.senderName,
      type,
    };

    if (type === 'text') {
      if (!caption) throw fail(400, 'Message is empty.');
      doc.text = caption;
    } else if (type === 'poll') {
      doc.poll = this.buildPoll(input.poll);
      doc.text = [
        `📊 POLL: ${doc.poll.question}`,
        ...doc.poll.options.map((o) => `• ${o.text}`),
      ].join('\n');
    } else {
      const attachment = input.attachment;
      if (!attachment?.url || !/^https:\/\//.test(attachment.url)) {
        throw fail(400, 'Attachment is missing.');
      }
      doc.attachment = attachment;
      const summary: Record<string, string> = {
        image: '📷 Photo',
        file: `📄 ${attachment.name ?? 'Document'}`,
        voice: '🎤 Voice message',
        sticker: '💟 Sticker',
      };
      doc.text = caption || summary[type];
    }

    if (input.replyToId) {
      const original = await this.chatModel
        .findOne({ _id: input.replyToId, roomId: input.roomId })
        .exec()
        .catch(() => null);
      if (original) {
        doc.replyTo = {
          messageId: String(original._id),
          senderPhone: original.senderPhone,
          senderName: original.senderName,
          type: original.type,
          text: original.text.slice(0, 200),
        };
      }
    }

    return new this.chatModel(doc).save();
  }

  private buildPoll(poll: SendMessageInput['poll']) {
    const question = poll?.question?.trim().slice(0, 300);
    const options = (poll?.options ?? [])
      .map((o) => (typeof o === 'string' ? o.trim().slice(0, 100) : ''))
      .filter(Boolean);
    if (!question) throw fail(400, 'A poll needs a question.');
    if (options.length < 2) throw fail(400, 'A poll needs at least 2 options.');
    if (options.length > MAX_POLL_OPTIONS) {
      throw fail(400, `A poll can have at most ${MAX_POLL_OPTIONS} options.`);
    }
    return {
      question,
      allowMultiple: !!poll?.allowMultiple,
      options: options.map((text, i) => ({ id: `o${i + 1}`, text, voters: [] })),
    };
  }

  async getHistory(roomId: string, limit = 100): Promise<ChatMessage[]> {
    const docs = await this.chatModel
      .find({ roomId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.reverse();
  }

  private async findMessage(roomId: string, messageId: string) {
    const message = await this.chatModel
      .findOne({ _id: messageId, roomId })
      .exec()
      .catch(() => null);
    if (!message) throw fail(404, 'Message not found.');
    return message;
  }

  /// One reaction per person per message; a null/empty emoji removes it.
  async react(roomId: string, messageId: string, phone: string, name: string | undefined, emoji?: string | null) {
    const message = await this.findMessage(roomId, messageId);
    if (message.deleted) throw fail(400, 'This message was deleted.');
    message.reactions = message.reactions.filter((r) => r.phone !== phone);
    const trimmed = emoji?.trim().slice(0, 16);
    if (trimmed) message.reactions.push({ phone, name, emoji: trimmed });
    return message.save();
  }

  async edit(roomId: string, messageId: string, phone: string, text: string) {
    const message = await this.findMessage(roomId, messageId);
    if (message.senderPhone !== phone) throw fail(403, 'You can only edit your own messages.');
    if (message.deleted) throw fail(400, 'This message was deleted.');
    if (message.type !== 'text') throw fail(400, 'Only text messages can be edited.');
    const sentAt = (message as unknown as { createdAt: Date }).createdAt;
    if (Date.now() - new Date(sentAt).getTime() > CHAT_EDIT_WINDOW_MS) {
      throw fail(400, 'Messages can only be edited within 15 minutes of sending.');
    }
    const trimmed = (text ?? '').trim().slice(0, MAX_TEXT_LENGTH);
    if (!trimmed) throw fail(400, 'Message is empty.');
    message.text = trimmed;
    message.editedAt = new Date();
    return message.save();
  }

  /// "Delete for everyone": the message stays in place (so replies and
  /// ordering hold up) but its content is wiped.
  async delete(roomId: string, messageId: string, phone: string) {
    const message = await this.findMessage(roomId, messageId);
    if (message.senderPhone !== phone) throw fail(403, 'You can only delete your own messages.');
    message.deleted = true;
    message.text = DELETED_TEXT;
    message.attachment = undefined;
    message.poll = undefined;
    message.replyTo = undefined;
    message.reactions = [];
    return message.save();
  }

  /// Replaces the voter's choices; an empty list withdraws their vote.
  async vote(roomId: string, messageId: string, phone: string, optionIds: string[]) {
    const message = await this.findMessage(roomId, messageId);
    if (message.type !== 'poll' || !message.poll) throw fail(400, 'This is not a poll.');
    const chosen = new Set((optionIds ?? []).filter((id) => typeof id === 'string'));
    if (!message.poll.allowMultiple && chosen.size > 1) {
      throw fail(400, 'This poll allows only one choice.');
    }
    for (const option of message.poll.options) {
      option.voters = option.voters.filter((v) => v !== phone);
      if (chosen.has(option.id)) option.voters.push(phone);
    }
    message.markModified('poll');
    return message.save();
  }

  async markRead(phoneNumber: string, roomId: string) {
    const lastReadAt = new Date();
    await this.chatReadModel.updateOne(
      { phoneNumber, roomId },
      { $set: { lastReadAt } },
      { upsert: true },
    );
    return { phoneNumber, roomId, lastReadAt };
  }

  async getRoomReads(roomId: string) {
    const reads = await this.chatReadModel.find({ roomId }).exec();
    return reads.map((r) => ({ phoneNumber: r.phoneNumber, lastReadAt: r.lastReadAt }));
  }

  /// Unread message counts for every room the user belongs to (their DMs
  /// plus their profession group), counting only other people's messages
  /// sent after the user last had that room open. Rooms with nothing unread
  /// are left out of `rooms`. The app polls this while it's open, so it also
  /// doubles as the user's "online" heartbeat.
  async getUnreadCounts(phoneNumber: string) {
    const [dmRoomIds, myBiodata] = await Promise.all([
      this.findMyDmRoomIds(phoneNumber),
      this.biodataModel.findOne({ phoneNumber }).sort({ createdAt: -1 }).exec(),
      this.authUserModel.updateOne({ phoneNumber }, { $set: { lastSeenAt: new Date() } }),
    ]);
    const roomIds = [...dmRoomIds];
    if (myBiodata?.professionCategory) {
      roomIds.push(categoryRoomId(myBiodata.professionCategory));
    }

    const reads = await this.chatReadModel
      .find({ phoneNumber, roomId: { $in: roomIds } })
      .exec();
    const lastReadByRoom = new Map(reads.map((r) => [r.roomId, r.lastReadAt]));

    const rooms: Record<string, number> = {};
    let total = 0;
    await Promise.all(
      roomIds.map(async (roomId) => {
        const lastReadAt = lastReadByRoom.get(roomId);
        const count = await this.chatModel.countDocuments({
          roomId,
          senderPhone: { $ne: phoneNumber },
          ...(lastReadAt ? { createdAt: { $gt: lastReadAt } } : {}),
        });
        if (count > 0) {
          rooms[roomId] = count;
          total += count;
        }
      }),
    );
    return { total, rooms };
  }

  async getPresence(phoneNumber: string) {
    const user = await this.authUserModel.findOne({ phoneNumber }).exec();
    return { phoneNumber, lastSeenAt: user?.lastSeenAt ?? null };
  }

  async registerDevice(phoneNumber: string, token: string) {
    if (!token) throw fail(400, 'Device token is missing.');
    // A device token belongs to one account at a time (the last one to log
    // in on that phone).
    await this.authUserModel.updateMany({ fcmTokens: token }, { $pull: { fcmTokens: token } });
    await this.authUserModel.updateOne({ phoneNumber }, { $addToSet: { fcmTokens: token } });
    return { success: true };
  }

  async unregisterDevice(phoneNumber: string, token: string) {
    await this.authUserModel.updateOne({ phoneNumber }, { $pull: { fcmTokens: token } });
    return { success: true };
  }

  private async findMyDmRoomIds(phoneNumber: string): Promise<string[]> {
    const allDmRoomIds: string[] = await this.chatModel.distinct('roomId', {
      roomId: { $regex: '^dm::' },
    });
    return allDmRoomIds.filter((roomId) => {
      const parts = roomId.split('::');
      return parts[1] === phoneNumber || parts[2] === phoneNumber;
    });
  }

  /// Lists the current user's DM conversations (room id encodes both phone
  /// numbers, so this scans for rooms where one side matches), each with a
  /// preview of the last message and the other person's name, newest first.
  async getMyDmRooms(phoneNumber: string) {
    const myRoomIds = await this.findMyDmRoomIds(phoneNumber);

    const rooms = await Promise.all(
      myRoomIds.map(async (roomId: string) => {
        const parts = roomId.split('::');
        const otherPhone = parts[1] === phoneNumber ? parts[2] : parts[1];
        const [lastMessage, otherPerson] = await Promise.all([
          this.chatModel.findOne({ roomId }).sort({ createdAt: -1 }).exec(),
          this.biodataModel
            .findOne({ phoneNumber: otherPhone })
            .sort({ createdAt: -1 })
            .exec(),
        ]);
        const lastMessageDoc = lastMessage as unknown as {
          text?: string;
          createdAt?: Date;
        } | null;
        return {
          roomId,
          otherPhone,
          otherName: otherPerson?.fullName ?? otherPhone,
          lastMessage: lastMessageDoc?.text ?? '',
          lastMessageAt: lastMessageDoc?.createdAt ?? null,
        };
      }),
    );

    rooms.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
    return rooms;
  }
}
