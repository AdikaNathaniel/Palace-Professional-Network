import { AppState, type NativeEventSubscription } from 'react-native';
import { toast } from 'sonner-native';
import { createStore } from 'zustand/vanilla';

import { ApiError } from '@/lib/api/client';
import { chatApi } from '@/lib/api/endpoints';
import type {
  ChatAttachment,
  ChatMessage,
  ChatReaction,
  ChatReply,
  LocalFile,
  RoomRead,
} from '@/lib/api/types';
import { createChatSocket, type ChatSocket, type OutgoingMessage } from '@/lib/chat/socket';

/** The server lets authors edit text messages for this long (CHAT_EDIT_WINDOW_MS). */
export const EDIT_WINDOW_MS = 15 * 60 * 1000;

const HISTORY_TIMEOUT_MS = 15_000;
/** An optimistic message with no echo from the server by then is shown as failed. */
const SEND_TIMEOUT_MS = 20_000;
const TYPING_RESEND_MS = 3_000;
const TYPING_IDLE_MS = 4_000;
const TYPING_EXPIRY_MS = 6_000;

const DELETED_TEXT = 'This message was deleted';

/** The text the server stores for media without a caption (ChatService.sendMessage). */
function summaryFor(type: ChatMessage['type'], attachment?: ChatAttachment) {
  switch (type) {
    case 'image':
      return '📷 Photo';
    case 'file':
      return `📄 ${attachment?.name ?? 'Document'}`;
    case 'voice':
      return '🎤 Voice message';
    case 'sticker':
      return '💟 Sticker';
    default:
      return '';
  }
}

/** Caption shown under media; empty when the text is only the server's summary. */
export function captionOf(message: ChatMessage) {
  if (message.type === 'text' || message.type === 'poll') return '';
  return message.text === summaryFor(message.type, message.attachment) ? '' : message.text;
}

/** A local file that still has to go through chatApi.upload before sending. */
export type PendingUpload = LocalFile & Omit<ChatAttachment, 'url' | 'name' | 'mimeType'>;

export type UiMessage = ChatMessage & {
  /**
   * Stable list key: the server id, or the local id an optimistic message
   * started with (kept after the server confirms it, so the row isn't
   * remounted).
   */
  key: string;
  /** Unset once the server has the message. */
  status?: 'pending' | 'failed';
  /** What to send (again, on retry). */
  outgoing?: OutgoingMessage;
  upload?: PendingUpload;
  /** When it was emitted; unset while uploading. */
  sentAt?: number;
  /** A local copy of an image, shown while the uploaded one loads. */
  previewUri?: string;
};

export type RoomStatus = 'connecting' | 'ready' | 'error';

export type RoomState = {
  status: RoomStatus;
  error: string | null;
  /** False while reconnecting after the first load. */
  connected: boolean;
  messages: UiMessage[];
  /** phone -> when they last had this chat open (read receipts). */
  reads: Record<string, string>;
  /** phone -> display name of people typing right now. */
  typers: Record<string, string>;
};

type Me = { phone: string; name?: string | null; token: string };

function toUi(message: ChatMessage): UiMessage {
  return { ...message, key: message._id };
}

function contentKey(message: { type: string; text?: string; attachment?: ChatAttachment; poll?: { question: string } }) {
  if (message.type === 'text') return `text:${message.text?.trim()}`;
  if (message.type === 'poll') return `poll:${message.poll?.question.trim()}`;
  return `${message.type}:${message.attachment?.url}`;
}

/** Whether `server` is the echo of the optimistic `local` message. */
function isEchoOf(local: UiMessage, server: ChatMessage, myPhone: string) {
  if (!local.outgoing || !local.sentAt || server.senderPhone !== myPhone) return false;
  return contentKey({ ...local.outgoing }) === contentKey(server);
}

/**
 * One per open chat screen: its own socket (a fresh, authenticated
 * connection, like the Flutter app's ChatService), joined to one room.
 * Disconnects in the background so the server push-notifies as usual, and
 * rejoins (refreshing history) when the app comes back.
 *
 * The protocol has no client message ids, so optimistic messages are
 * matched to the server's echo by sender and content.
 */
export class ChatRoomController {
  readonly store = createStore<RoomState>(() => ({
    status: 'connecting',
    error: null,
    connected: false,
    messages: [],
    reads: {},
    typers: {},
  }));

  private socket: ChatSocket | null = null;
  private appState: NativeEventSubscription | null = null;
  private historyTimer: ReturnType<typeof setTimeout> | null = null;
  private sendTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private typerTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private typingSentAt = 0;
  private typingStopTimer: ReturnType<typeof setTimeout> | null = null;
  private focused = false;
  private seq = 0;

  constructor(
    readonly roomId: string,
    private readonly me: Me,
  ) {}

  // ------------------------------------------------------------ lifecycle

  start() {
    this.connect();
    this.appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        this.connect();
      } else if (state === 'background') {
        this.stopTyping();
        this.disconnect();
      }
    });
  }

  stop() {
    this.stopTyping();
    this.appState?.remove();
    this.appState = null;
    this.disconnect();
    for (const timer of [...this.sendTimers.values(), ...this.typerTimers.values()]) {
      clearTimeout(timer);
    }
    this.sendTimers.clear();
    this.typerTimers.clear();
  }

  /** "Try again" on the error state: a brand-new connection. */
  retryConnection() {
    this.disconnect();
    this.store.setState({ status: 'connecting', error: null });
    this.connect();
  }

  /** The screen is focused (and so the member can see new messages). */
  setFocused(focused: boolean) {
    this.focused = focused;
    if (focused) this.markRead();
  }

  private get canSeeMessages() {
    return this.focused && AppState.currentState === 'active';
  }

  private connect() {
    if (this.socket?.connected) return;
    this.disconnect();

    const socket = createChatSocket(this.me.token);
    this.socket = socket;

    // Rejoin after every (re)connect: a new connection starts in no rooms.
    socket.on('connect', () => {
      this.store.setState({ connected: true });
      socket.emit('join', { roomId: this.roomId });
    });
    socket.on('disconnect', (reason) => {
      this.store.setState({ connected: false, typers: {} });
      // The server drops sockets whose token it can't verify; socket.io won't retry those.
      if (reason === 'io server disconnect' && this.socket === socket) {
        this.fail('Could not open this chat. Please sign out and in again.');
      }
    });
    socket.on('connect_error', () => {
      if (this.store.getState().status === 'connecting') {
        this.fail('Could not reach the chat server. Check your connection and try again.');
      }
    });
    socket.on('history', (data) => this.onHistory(data.roomId, data.messages, data.reads ?? []));
    socket.on('message', (message) => this.onMessage(message));
    socket.on('messageUpdated', (message) => this.onMessageUpdated(message));
    socket.on('typing', ({ roomId, phoneNumber, name, isTyping }) => {
      if (roomId === this.roomId) this.onTyping(phoneNumber, name, isTyping);
    });
    socket.on('read', ({ roomId, phoneNumber, lastReadAt }) => {
      if (roomId === this.roomId) this.onRead({ phoneNumber, lastReadAt });
    });
    socket.on('chatError', ({ message }) => this.onChatError(message));

    if (this.store.getState().status !== 'ready') {
      this.historyTimer = setTimeout(() => {
        if (this.store.getState().status === 'connecting') {
          this.fail('Could not load this chat. Check your connection and try again.');
        }
      }, HISTORY_TIMEOUT_MS);
    }
    socket.connect();
  }

  private disconnect() {
    if (this.historyTimer) clearTimeout(this.historyTimer);
    this.historyTimer = null;
    const socket = this.socket;
    this.socket = null;
    socket?.removeAllListeners();
    socket?.disconnect();
    this.store.setState({ connected: false, typers: {} });
  }

  private fail(error: string) {
    if (this.historyTimer) clearTimeout(this.historyTimer);
    // Once the chat has loaded, keep showing it; the header shows "Connecting…".
    if (this.store.getState().status === 'ready') return;
    this.store.setState({ status: 'error', error });
  }

  // ------------------------------------------------------- server events

  private onHistory(roomId: string, history: ChatMessage[], reads: RoomRead[]) {
    if (roomId !== this.roomId) return;
    if (this.historyTimer) clearTimeout(this.historyTimer);

    const { messages: current, reads: currentReads } = this.store.getState();
    const known = new Set(current.filter((m) => !m.status).map((m) => m._id));
    const previous = new Map(current.map((m) => [m._id, m]));
    const merged = history.map((m) => ({ ...toUi(m), key: previous.get(m._id)?.key ?? m._id }));

    // Optimistic messages the server saved while we were away are in the
    // history now; keep the rest (still pending, or failed) at the end.
    const locals: UiMessage[] = [];
    for (const local of current.filter((m) => m.status)) {
      const index = merged.findIndex(
        (m) => !known.has(m._id) && m.key === m._id && isEchoOf(local, m, this.me.phone),
      );
      if (index >= 0) {
        this.clearSendTimer(local.key);
        merged[index] = { ...merged[index]!, key: local.key, previewUri: local.previewUri };
      } else {
        locals.push(local);
      }
    }

    const nextReads = { ...currentReads };
    for (const read of reads) nextReads[read.phoneNumber] = read.lastReadAt;

    this.store.setState({
      status: 'ready',
      error: null,
      messages: [...merged, ...locals],
      reads: nextReads,
    });
  }

  private onMessage(message: ChatMessage) {
    if (message.roomId !== this.roomId) return;
    const { messages } = this.store.getState();
    if (messages.some((m) => m._id === message._id)) return;

    if (message.senderPhone === this.me.phone) {
      const local = messages.find((m) => m.status && isEchoOf(m, message, this.me.phone));
      if (local) {
        this.clearSendTimer(local.key);
        this.replace(local.key, { ...message, key: local.key, previewUri: local.previewUri });
        return;
      }
    } else {
      this.clearTyper(message.senderPhone);
      // Seen right away if the chat is on screen, so the sender's ticks update live.
      if (this.canSeeMessages) this.markRead();
    }

    // Keep in-flight messages last: they'll get a later server timestamp.
    const firstPending = messages.findIndex((m) => m.status === 'pending');
    const next = [...messages];
    next.splice(firstPending === -1 ? next.length : firstPending, 0, toUi(message));
    this.store.setState({ messages: next });
  }

  private onMessageUpdated(message: ChatMessage) {
    if (message.roomId !== this.roomId) return;
    const existing = this.store.getState().messages.find((m) => m._id === message._id);
    if (existing) {
      this.replace(existing.key, { ...message, key: existing.key, previewUri: existing.previewUri });
    }
  }

  private onTyping(phone: string, name: string | undefined, isTyping: boolean) {
    if (phone === this.me.phone) return;
    if (!isTyping) {
      this.clearTyper(phone);
      return;
    }
    const timer = this.typerTimers.get(phone);
    if (timer) clearTimeout(timer);
    this.typerTimers.set(
      phone,
      setTimeout(() => this.clearTyper(phone), TYPING_EXPIRY_MS),
    );
    const { typers } = this.store.getState();
    const label = name || this.nameFor(phone);
    if (typers[phone] !== label) this.store.setState({ typers: { ...typers, [phone]: label } });
  }

  private clearTyper(phone: string) {
    const timer = this.typerTimers.get(phone);
    if (timer) clearTimeout(timer);
    this.typerTimers.delete(phone);
    const { typers } = this.store.getState();
    if (!(phone in typers)) return;
    const next = { ...typers };
    delete next[phone];
    this.store.setState({ typers: next });
  }

  private onRead(read: RoomRead) {
    const { reads } = this.store.getState();
    const current = reads[read.phoneNumber];
    if (current && new Date(current) >= new Date(read.lastReadAt)) return;
    this.store.setState({ reads: { ...reads, [read.phoneNumber]: read.lastReadAt } });
  }

  /**
   * `chatError` doesn't say which request failed. If a send is in flight it's
   * almost certainly that; otherwise an optimistic reaction/edit/delete/vote
   * was refused, so rejoin to get the server's version back.
   */
  private onChatError(message = 'Something went wrong. Please try again.') {
    toast.error(message);
    const inFlight = this.store
      .getState()
      .messages.filter((m) => m.status === 'pending' && m.sentAt)
      .sort((a, b) => a.sentAt! - b.sentAt!)[0];
    if (inFlight) {
      this.clearSendTimer(inFlight.key);
      this.patch(inFlight.key, { status: 'failed' });
    } else {
      this.socket?.emit('join', { roomId: this.roomId });
    }
  }

  // ------------------------------------------------------------ sending

  /** Adds an optimistic message and sends it (uploading its file first). */
  send(outgoing: OutgoingMessage, options: { replyTo?: UiMessage | null; upload?: PendingUpload } = {}) {
    const { replyTo, upload } = options;
    const key = `local-${Date.now()}-${this.seq++}`;
    const attachment: ChatAttachment | undefined = upload
      ? {
          url: upload.uri,
          name: upload.name,
          mimeType: upload.mimeType,
          size: upload.size,
          width: upload.width,
          height: upload.height,
          durationMs: upload.durationMs,
        }
      : outgoing.attachment;
    const reply: ChatReply | undefined =
      replyTo && !replyTo.status
        ? {
            messageId: replyTo._id,
            senderPhone: replyTo.senderPhone,
            senderName: replyTo.senderName,
            type: replyTo.type,
            text: replyTo.text.slice(0, 200),
          }
        : undefined;

    const message: UiMessage = {
      _id: key,
      key,
      roomId: this.roomId,
      senderPhone: this.me.phone,
      senderName: this.me.name ?? undefined,
      type: outgoing.type,
      text: outgoing.text?.trim() || summaryFor(outgoing.type, attachment),
      attachment,
      replyTo: reply,
      poll: outgoing.poll && {
        question: outgoing.poll.question,
        allowMultiple: outgoing.poll.allowMultiple,
        options: outgoing.poll.options.map((text, i) => ({ id: `o${i + 1}`, text, voters: [] })),
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
      outgoing: { ...outgoing, replyToId: reply?.messageId },
      upload,
      previewUri: upload && outgoing.type === 'image' ? upload.uri : undefined,
    };

    this.stopTyping();
    this.store.setState((s) => ({ messages: [...s.messages, message] }));
    void this.dispatch(key);
  }

  retry(key: string) {
    this.patch(key, { status: 'pending', sentAt: undefined });
    void this.dispatch(key);
  }

  /** Removes a failed message that will never be sent. */
  discard(key: string) {
    this.clearSendTimer(key);
    this.store.setState((s) => ({ messages: s.messages.filter((m) => m.key !== key) }));
  }

  private async dispatch(key: string) {
    let message = this.find(key);
    if (!message?.outgoing) return;

    if (message.upload && !message.outgoing.attachment) {
      const { upload } = message;
      try {
        const uploaded = await chatApi.upload(upload);
        const attachment: ChatAttachment = {
          ...uploaded,
          // expo/fetch URL-encodes multipart filenames and the server keeps them as sent.
          name: upload.name || uploaded.name,
          width: uploaded.width ?? upload.width,
          height: uploaded.height ?? upload.height,
          durationMs: upload.durationMs ?? uploaded.durationMs,
        };
        message = this.patch(key, { outgoing: { ...message.outgoing, attachment } });
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : 'Upload failed. Please try again.');
        this.patch(key, { status: 'failed' });
        return;
      }
    }

    if (!message?.outgoing || message.status !== 'pending') return;
    // Android backgrounds the app for the camera / file picker, which drops
    // the socket; give it a moment to come back before giving up.
    const connected = await this.waitForConnection();
    message = this.find(key);
    if (!message?.outgoing || message.status !== 'pending') return;
    const socket = this.socket;
    if (!connected || !socket?.connected) {
      this.patch(key, { status: 'failed' });
      return;
    }
    socket.emit('message', {
      roomId: this.roomId,
      senderName: this.me.name ?? undefined,
      ...message.outgoing,
    });
    this.patch(key, { sentAt: Date.now() });
    this.sendTimers.set(
      key,
      setTimeout(() => {
        this.sendTimers.delete(key);
        if (this.find(key)?.status === 'pending') this.patch(key, { status: 'failed' });
      }, SEND_TIMEOUT_MS),
    );
  }

  private waitForConnection(timeoutMs = 8_000) {
    if (this.store.getState().connected) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);
      const unsubscribe = this.store.subscribe((state) => {
        if (!state.connected) return;
        clearTimeout(timer);
        unsubscribe();
        resolve(true);
      });
    });
  }

  private clearSendTimer(key: string) {
    const timer = this.sendTimers.get(key);
    if (timer) clearTimeout(timer);
    this.sendTimers.delete(key);
  }

  // ---------------------------------------------- changing a message
  // Applied optimistically; the server's messageUpdated replaces them.

  myReaction(message: ChatMessage) {
    return message.reactions?.find((r) => r.phone === this.me.phone)?.emoji ?? null;
  }

  /** Reacting with your current emoji again removes it. */
  react(message: UiMessage, emoji: string | null) {
    if (message.status || message.deleted) return;
    const next = emoji && this.myReaction(message) === emoji ? null : emoji;
    const others = (message.reactions ?? []).filter((r) => r.phone !== this.me.phone);
    const reactions: ChatReaction[] = next
      ? [...others, { phone: this.me.phone, name: this.me.name ?? undefined, emoji: next }]
      : others;
    this.patch(message.key, { reactions });
    this.socket?.emit('react', {
      roomId: this.roomId,
      messageId: message._id,
      emoji: next,
      name: this.me.name ?? undefined,
    });
  }

  edit(message: UiMessage, text: string) {
    const trimmed = text.trim();
    if (message.status || !trimmed || trimmed === message.text) return;
    this.patch(message.key, { text: trimmed, editedAt: new Date().toISOString() });
    this.socket?.emit('edit', { roomId: this.roomId, messageId: message._id, text: trimmed });
  }

  delete(message: UiMessage) {
    if (message.status) {
      this.discard(message.key);
      return;
    }
    this.patch(message.key, {
      deleted: true,
      text: DELETED_TEXT,
      attachment: undefined,
      poll: undefined,
      replyTo: undefined,
      reactions: [],
    });
    this.socket?.emit('delete', { roomId: this.roomId, messageId: message._id });
  }

  /** Replaces the member's choices; an empty list withdraws their vote. */
  vote(message: UiMessage, optionIds: string[]) {
    const poll = message.poll;
    if (message.status || !poll) return;
    const chosen = new Set(optionIds);
    this.patch(message.key, {
      poll: {
        ...poll,
        options: poll.options.map((o) => ({
          ...o,
          voters: [...o.voters.filter((v) => v !== this.me.phone), ...(chosen.has(o.id) ? [this.me.phone] : [])],
        })),
      },
    });
    this.socket?.emit('vote', { roomId: this.roomId, messageId: message._id, optionIds });
  }

  canEdit(message: UiMessage) {
    const sentAt = message.createdAt ? new Date(message.createdAt).getTime() : 0;
    return (
      !message.status &&
      !message.deleted &&
      message.type === 'text' &&
      message.senderPhone === this.me.phone &&
      Date.now() - sentAt < EDIT_WINDOW_MS
    );
  }

  // ------------------------------------------------------------- typing

  /** Call on every composer change: sends "typing" at most every few seconds. */
  onComposerChanged(hasText: boolean) {
    if (this.typingStopTimer) clearTimeout(this.typingStopTimer);
    if (!hasText) {
      this.stopTyping();
      return;
    }
    const now = Date.now();
    if (now - this.typingSentAt > TYPING_RESEND_MS) {
      this.typingSentAt = now;
      this.emitTyping(true);
    }
    this.typingStopTimer = setTimeout(() => this.stopTyping(), TYPING_IDLE_MS);
  }

  stopTyping() {
    if (this.typingStopTimer) clearTimeout(this.typingStopTimer);
    this.typingStopTimer = null;
    if (!this.typingSentAt) return;
    this.typingSentAt = 0;
    this.emitTyping(false);
  }

  private emitTyping(isTyping: boolean) {
    this.socket?.emit('typing', { roomId: this.roomId, isTyping, name: this.me.name ?? undefined });
  }

  private markRead() {
    if (this.socket?.connected) this.socket.emit('read', { roomId: this.roomId });
  }

  // ------------------------------------------------------------ helpers

  /** Best display name for a phone number, from what this chat has seen. */
  nameFor(phone: string) {
    if (phone === this.me.phone) return 'You';
    const { messages } = this.store.getState();
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]!;
      if (m.senderPhone === phone && m.senderName) return m.senderName;
      const reaction = m.reactions?.find((r) => r.phone === phone && r.name);
      if (reaction?.name) return reaction.name;
    }
    return phone;
  }

  find(key: string) {
    return this.store.getState().messages.find((m) => m.key === key);
  }

  private replace(key: string, message: UiMessage) {
    this.store.setState((s) => ({
      messages: s.messages.map((m) => (m.key === key ? message : m)),
    }));
  }

  private patch(key: string, changes: Partial<UiMessage>) {
    let updated: UiMessage | undefined;
    this.store.setState((s) => ({
      messages: s.messages.map((m) => {
        if (m.key !== key) return m;
        updated = { ...m, ...changes };
        return updated;
      }),
    }));
    return updated;
  }
}
