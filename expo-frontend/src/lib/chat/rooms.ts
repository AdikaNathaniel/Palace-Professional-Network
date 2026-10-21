/**
 * Mirrors the backend's room id scheme (chat.constants.ts) so both sides
 * always compute the same id for a given pair or profession.
 */

export function categoryRoomId(category: string) {
  return `cat::${category}`;
}

export function dmRoomId(phoneA: string, phoneB: string) {
  const [a, b] = [phoneA, phoneB].sort();
  return `dm::${a}::${b}`;
}

export function isDmRoom(roomId: string) {
  return roomId.startsWith('dm::');
}

/** The other participant's phone in a DM room, or null for group rooms. */
export function otherPhoneInDm(roomId: string, myPhone: string): string | null {
  if (!isDmRoom(roomId)) return null;
  const [, a, b] = roomId.split('::');
  if (a === myPhone) return b ?? null;
  if (b === myPhone) return a ?? null;
  return null;
}

/** The profession a group room belongs to ("cat::Medicine (Doctors)" -> "Medicine (Doctors)"). */
export function categoryOfRoom(roomId: string): string | null {
  return roomId.startsWith('cat::') ? roomId.slice('cat::'.length) : null;
}

/** "Medicine (Doctors, Dentists)" -> "Medicine", like the Flutter app's ProfessionImages.shortLabel. */
export function professionShortLabel(category: string) {
  const idx = category.indexOf('(');
  return (idx === -1 ? category : category.slice(0, idx)).trim();
}
