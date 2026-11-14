/**
 * Shapes returned by the gateway. Dates stay ISO strings here; parse them
 * where they're displayed.
 */

export type UserSession = {
  phoneNumber: string;
  fullName?: string | null;
  token: string;
};

export type Biodata = {
  _id?: string;
  fullName: string;
  ageRange: string;
  gender: string;
  maritalStatus: string;
  email?: string | null;
  phoneNumber: string;
  professionCategory: string;
  professionSubCategory?: string | null;
  placeOfWork: string;
  imageUrl?: string | null;
  createdAt?: string;
};

export type BiodataOptions = {
  ageRanges: string[];
  genders: string[];
  maritalStatuses: string[];
  professionCategories: string[];
  professionSubCategories: Record<string, string[]>;
};

/** Fields for POST /biodata (sent as multipart, with an optional image). */
export type BiodataInput = Omit<Biodata, '_id' | 'imageUrl' | 'createdAt'>;

/** A local file picked with expo-image-picker / expo-document-picker. */
export type LocalFile = {
  uri: string;
  name: string;
  mimeType: string;
};

/** Mirrors the backend's CHAT_MESSAGE_TYPES. */
export type ChatMessageType = 'text' | 'image' | 'file' | 'voice' | 'sticker' | 'poll';

export type ChatAttachment = {
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  durationMs?: number;
};

export type ChatReply = {
  messageId: string;
  senderPhone?: string;
  senderName?: string;
  type?: ChatMessageType;
  text: string;
};

export type ChatReaction = {
  phone: string;
  name?: string;
  emoji: string;
};

export type ChatPollOption = {
  id: string;
  text: string;
  voters: string[];
};

export type ChatPoll = {
  question: string;
  allowMultiple: boolean;
  options: ChatPollOption[];
};

export type ChatMessage = {
  _id: string;
  roomId: string;
  senderPhone: string;
  senderName?: string;
  type: ChatMessageType;
  /** For text messages the message itself; otherwise a caption or a summary like "📷 Photo". */
  text: string;
  attachment?: ChatAttachment;
  replyTo?: ChatReply;
  reactions?: ChatReaction[];
  poll?: ChatPoll;
  editedAt?: string;
  deleted?: boolean;
  createdAt?: string;
};

/** When a room member last had the chat open (drives read receipts). */
export type RoomRead = {
  phoneNumber: string;
  lastReadAt: string;
};

export type DmRoomPreview = {
  roomId: string;
  otherPhone: string;
  otherName: string;
  otherImageUrl?: string | null;
  lastMessage: string;
  lastMessageAt?: string | null;
};

/** GET /chat/unread. Rooms with nothing unread are absent from `rooms`. */
export type UnreadCounts = {
  total: number;
  rooms: Record<string, number>;
};

export type Presence = {
  lastSeenAt?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
};

export type Sticker = {
  id: string;
  previewUrl: string;
  url: string;
  width: number;
  height: number;
};
