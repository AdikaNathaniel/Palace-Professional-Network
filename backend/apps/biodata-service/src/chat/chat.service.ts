import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from '../schemas/chat-message.schema';
import { Biodata, BiodataDocument } from '../schemas/biodata.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessageDocument>,
    @InjectModel(Biodata.name) private biodataModel: Model<BiodataDocument>,
  ) {}

  async sendMessage(
    roomId: string,
    senderPhone: string,
    senderName: string | undefined,
    text: string,
  ): Promise<ChatMessage> {
    const created = new this.chatModel({ roomId, senderPhone, senderName, text });
    return created.save();
  }

  async getHistory(roomId: string, limit = 100): Promise<ChatMessage[]> {
    const docs = await this.chatModel
      .find({ roomId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.reverse();
  }

  /// Lists the current user's DM conversations (room id encodes both phone
  /// numbers, so this scans for rooms where one side matches), each with a
  /// preview of the last message and the other person's name, newest first.
  async getMyDmRooms(phoneNumber: string) {
    const allDmRoomIds = await this.chatModel.distinct('roomId', {
      roomId: { $regex: '^dm::' },
    });
    const myRoomIds = allDmRoomIds.filter((roomId: string) => {
      const parts = roomId.split('::');
      return parts[1] === phoneNumber || parts[2] === phoneNumber;
    });

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
