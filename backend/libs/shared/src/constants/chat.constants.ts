export const CHAT_TCP_PATTERNS = {
  SEND: 'chat.send',
  HISTORY: 'chat.history',
  MY_DM_ROOMS: 'chat.myDmRooms',
} as const;

/// A group chat room is shared by everyone whose biodata's professionCategory
/// matches. A DM room is deterministic from the two participants' phone
/// numbers (sorted, so either side computes the same id) - neither needs to
/// be pre-created, they're just string keys messages are grouped under.
export function categoryRoomId(category: string): string {
  return `cat::${category}`;
}

export function dmRoomId(phoneA: string, phoneB: string): string {
  const [a, b] = [phoneA, phoneB].sort();
  return `dm::${a}::${b}`;
}

export function otherPhoneInDmRoom(roomId: string, myPhone: string): string | null {
  if (!roomId.startsWith('dm::')) return null;
  const [, a, b] = roomId.split('::');
  if (a === myPhone) return b;
  if (b === myPhone) return a;
  return null;
}
