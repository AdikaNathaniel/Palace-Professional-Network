import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { ChatMessage, ChatMessageDocument } from '../schemas/chat-message.schema';
import { Biodata, BiodataDocument } from '../schemas/biodata.schema';
import { AuthUser, AuthUserDocument } from '../schemas/auth-user.schema';

const MAX_TOKENS_PER_SEND = 500;
const STALE_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/// Push notifications for new chat messages via Firebase Cloud Messaging.
/// Disabled (every call is a no-op) unless FIREBASE_SERVICE_ACCOUNT holds a
/// Firebase service-account key, as raw JSON or base64-encoded JSON.
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private messaging: Messaging | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessageDocument>,
    @InjectModel(Biodata.name) private biodataModel: Model<BiodataDocument>,
    @InjectModel(AuthUser.name) private authUserModel: Model<AuthUserDocument>,
  ) {}

  onModuleInit() {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT')?.trim();
    if (!raw) {
      this.logger.log('FIREBASE_SERVICE_ACCOUNT not set - push notifications disabled.');
      return;
    }
    try {
      const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      const app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(json)) });
      this.messaging = getMessaging(app);
      this.logger.log('Push notifications enabled.');
    } catch (err) {
      this.logger.error(`Invalid FIREBASE_SERVICE_ACCOUNT - push disabled: ${err}`);
    }
  }

  /// Notifies everyone in the message's room except the sender and anyone
  /// who currently has that chat open (`excludePhones`, from the gateway).
  async notifyNewMessage(messageId: string, excludePhones: string[] = []) {
    if (!this.messaging) return;
    const message = await this.chatModel.findById(messageId).exec().catch(() => null);
    if (!message) return;

    const skip = new Set([message.senderPhone, ...excludePhones]);
    let recipients: string[] = [];
    let title = message.senderName ?? message.senderPhone;
    let body = message.text;

    if (message.roomId.startsWith('dm::')) {
      recipients = message.roomId.split('::').slice(1);
    } else if (message.roomId.startsWith('cat::')) {
      const category = message.roomId.slice('cat::'.length);
      recipients = await this.biodataModel.distinct('phoneNumber', { professionCategory: category });
      title = category.split('(')[0].trim();
      body = `${message.senderName ?? message.senderPhone}: ${message.text}`;
    }
    recipients = recipients.filter((p) => !skip.has(p));
    if (!recipients.length) return;

    const users = await this.authUserModel
      .find({ phoneNumber: { $in: recipients }, 'fcmTokens.0': { $exists: true } })
      .exec();
    const tokens = users.flatMap((u) => u.fcmTokens);
    if (!tokens.length) return;

    const chatTitle = message.roomId.startsWith('dm::')
      ? (message.senderName ?? message.senderPhone)
      : title;
    const stale: string[] = [];
    for (let i = 0; i < tokens.length; i += MAX_TOKENS_PER_SEND) {
      const batch = tokens.slice(i, i + MAX_TOKENS_PER_SEND);
      try {
        const result = await this.messaging.sendEachForMulticast({
          tokens: batch,
          notification: { title, body: body.slice(0, 200) },
          data: { roomId: message.roomId, title: chatTitle },
          android: {
            priority: 'high',
            notification: { tag: message.roomId },
          },
        });
        result.responses.forEach((r, idx) => {
          if (!r.success && r.error && STALE_TOKEN_ERRORS.has(r.error.code)) {
            stale.push(batch[idx]);
          }
        });
      } catch (err) {
        this.logger.warn(`Push send failed: ${err}`);
      }
    }
    if (stale.length) {
      await this.authUserModel.updateMany({}, { $pull: { fcmTokens: { $in: stale } } });
    }
  }
}
