import { File } from 'expo-file-system';

import { request } from './client';
import type {
  Biodata,
  BiodataInput,
  BiodataOptions,
  ChatAttachment,
  DmRoomPreview,
  LocalFile,
  Presence,
  Sticker,
  UnreadCounts,
  UserSession,
} from './types';

/** The server rejects chat uploads over this size. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/**
 * The global fetch is expo/fetch, which doesn't accept React Native's
 * `{ uri, name, type }` parts ("Unsupported FormDataPart implementation");
 * it reads a part's contents through `bytes()`.
 */
function appendFile(form: FormData, field: string, file: LocalFile) {
  const local = new File(file.uri);
  const part = { name: file.name, type: file.mimeType, bytes: () => local.bytes() };
  form.append(field, part as unknown as Blob);
}

export const authApi = {
  login: (body: { phoneNumber: string; pin: string }) =>
    request<UserSession>('/auth/login', { method: 'POST', body, anonymous: true }),

  register: (body: { phoneNumber: string; pin: string; fullName?: string }) =>
    request<UserSession>('/auth/register', { method: 'POST', body, anonymous: true }),

  changePin: (body: { currentPin: string; newPin: string }) =>
    request<void>('/auth/change-pin', { method: 'POST', body }),
};

export const biodataApi = {
  options: () => request<BiodataOptions>('/biodata/options', { anonymous: true }),

  /** The signed-in member's own record, or null if they haven't submitted one. */
  mine: () => request<Biodata | null>('/biodata/me'),

  list: () => request<Biodata[]>('/biodata'),

  /** Creates or updates the member's record (matched server-side by phone number). */
  submit: (input: BiodataInput, image?: LocalFile) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(input)) {
      const text = typeof value === 'string' ? value.trim() : value;
      if (text) form.append(key, text);
    }
    if (image) appendFile(form, 'image', image);
    return request<Biodata>('/biodata', { method: 'POST', body: form });
  },
};

export const chatApi = {
  dmRooms: () => request<DmRoomPreview[]>('/chat/dm-rooms'),

  unread: () => request<UnreadCounts>('/chat/unread'),

  presence: (phoneNumber: string) =>
    request<Presence>(`/chat/presence/${encodeURIComponent(phoneNumber)}`),

  /** `kind` is "stickers" or "gifs"; an empty query returns trending. */
  stickers: (q: string, kind: 'stickers' | 'gifs' = 'stickers') =>
    request<Sticker[]>(`/chat/stickers?${new URLSearchParams({ q, kind })}`),

  upload: (file: LocalFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return request<ChatAttachment>('/chat/upload', { method: 'POST', body: form });
  },

  registerDeviceToken: (token: string) =>
    request<void>('/chat/device-token', { method: 'POST', body: { token } }),

  unregisterDeviceToken: (token: string) =>
    request<void>('/chat/device-token', { method: 'DELETE', body: { token } }),
};
