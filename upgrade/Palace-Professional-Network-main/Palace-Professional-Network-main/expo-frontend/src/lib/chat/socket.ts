import { io, type Socket } from 'socket.io-client';

import type { ChatAttachment, ChatMessage, ChatMessageType, RoomRead } from '@/lib/api/types';
import { API_BASE_URL } from '@/lib/config';

/** Payloads from backend/apps/gateway/src/chat/chat.gateway.ts. */
export type ServerToClientEvents = {
  history: (data: { roomId: string; messages: ChatMessage[]; reads?: RoomRead[] }) => void;
  message: (message: ChatMessage) => void;
  /** A reaction, edit, delete or poll vote changed this message; it's sent whole. */
  messageUpdated: (message: ChatMessage) => void;
  typing: (data: { roomId: string; phoneNumber: string; name?: string; isTyping: boolean }) => void;
  read: (data: RoomRead & { roomId: string }) => void;
  chatError: (data: { message?: string }) => void;
  /** Inbox socket only: something new arrived in this room. */
  inbox: (data: { roomId: string }) => void;
};

export type OutgoingMessage = {
  type: ChatMessageType;
  /** The message for text; an optional caption otherwise. */
  text?: string;
  attachment?: ChatAttachment;
  replyToId?: string;
  poll?: { question: string; options: string[]; allowMultiple: boolean };
};

type MessageRef = { roomId: string; messageId: string };

export type ClientToServerEvents = {
  join: (data: { roomId: string }) => void;
  leave: (data: { roomId: string }) => void;
  watch: (data: { roomIds: string[] }) => void;
  message: (data: OutgoingMessage & { roomId: string; senderName?: string }) => void;
  /** A null emoji removes the sender's reaction. */
  react: (data: MessageRef & { emoji: string | null; name?: string }) => void;
  edit: (data: MessageRef & { text: string }) => void;
  delete: (data: MessageRef) => void;
  vote: (data: MessageRef & { optionIds: string[] }) => void;
  typing: (data: { roomId: string; isTyping: boolean; name?: string }) => void;
  read: (data: { roomId: string }) => void;
};

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * A new, not-yet-connected socket authenticated as `token`.
 *
 * `forceNew` matters: without it socket.io multiplexes onto any connection
 * already open for this URL and skips the auth handshake, so after switching
 * accounts every message was stamped with the first account's phone number.
 */
export function createChatSocket(token: string): ChatSocket {
  return io(API_BASE_URL, {
    transports: ['websocket'],
    auth: { token },
    forceNew: true,
    autoConnect: false,
  });
}
