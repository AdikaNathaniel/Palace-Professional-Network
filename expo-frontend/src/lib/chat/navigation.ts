import { router } from 'expo-router';

import { dmRoomId } from '@/lib/chat/rooms';
import { useSession } from '@/stores/session';

type ChatParams = {
  /** Shown while the screen works out the real name; optional. */
  title?: string;
  /** The other person's photo in a DM, if the caller already has it. */
  imageUrl?: string | null;
};

/**
 * Opens a chat by room id. This is the hook point for push notifications:
 * a notification tap handler only needs to call `openChat(data.roomId)`. The
 * screen works out its own title and avatar, so the params are optional.
 */
export function openChat(roomId: string, { title, imageUrl }: ChatParams = {}) {
  router.push({
    pathname: '/chat/[roomId]',
    params: { roomId, ...(title ? { title } : {}), ...(imageUrl ? { imageUrl } : {}) },
  });
}

/**
 * Opens (or starts) a DM with another member, e.g. from the Directory's
 * member page. Returns false if that isn't possible (signed out, or it's
 * the member's own number).
 */
export function openDirectMessage(otherPhone: string, params: ChatParams = {}) {
  const myPhone = useSession.getState().session?.phoneNumber;
  if (!myPhone || myPhone === otherPhone) return false;
  openChat(dmRoomId(myPhone, otherPhone), params);
  return true;
}

let activeRoomId: string | null = null;

/**
 * The chat currently on screen, so a foreground push handler can skip
 * notifying about messages the member is already looking at.
 */
export function getActiveChatRoom() {
  return activeRoomId;
}

export function setActiveChatRoom(roomId: string | null) {
  activeRoomId = roomId;
}
