import type { Biodata } from '@/lib/api/types';
import { tradeOf } from '@/lib/biodata';
import { professionShortLabel } from '@/lib/chat/rooms';

/**
 * Lowercased, accents stripped and runs of spaces collapsed, so "  Ámà
 * Mensah" and "ama mensah" compare equal.
 */
export function normalizeSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** A stable key for a member, for lists. */
export function memberKey(member: Biodata) {
  return member._id ?? member.phoneNumber;
}

export type DirectoryEntry = { member: Biodata; isMe: boolean };

type IndexedEntry = DirectoryEntry & { haystack: string };

/**
 * Everyone, alphabetical, with the signed-in member first (they're labelled
 * "You"). Each entry carries the text the search box matches against: name,
 * profession, trade and place of work.
 */
export function indexDirectory(members: Biodata[], myPhone: string | undefined): IndexedEntry[] {
  const entries = members.map((member) => ({
    member,
    isMe: !!myPhone && member.phoneNumber === myPhone,
    haystack: normalizeSearch(
      [member.fullName, member.professionCategory, tradeOf(member) ?? '', member.placeOfWork].join(' '),
    ),
  }));
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
  return entries.sort(
    (a, b) => Number(b.isMe) - Number(a.isMe) || collator.compare(a.member.fullName.trim(), b.member.fullName.trim()),
  );
}

/**
 * Entries in the category (if any) that contain every word typed, in any
 * order, so "mensah gpha" finds Ama Mensah who works at the ports authority.
 */
export function filterDirectory(entries: IndexedEntry[], query: string, category: string | null) {
  const words = normalizeSearch(query).split(' ').filter(Boolean);
  if (!words.length && !category) return entries;
  return entries.filter(
    (e) =>
      (!category || e.member.professionCategory === category) &&
      words.every((w) => e.haystack.includes(w)),
  );
}

/** What a member does, compactly: their trade, or their profession without its parenthetical. */
export function shortProfessionLine(member: Biodata) {
  return tradeOf(member) ?? professionShortLabel(member.professionCategory);
}

/** How many members are in each profession category. */
export function countByCategory(members: Biodata[] | undefined) {
  const counts = new Map<string, number>();
  for (const m of members ?? []) {
    counts.set(m.professionCategory, (counts.get(m.professionCategory) ?? 0) + 1);
  }
  return counts;
}

/** The heading a name is filed under: its first letter, or "#". */
export function indexLetter(name: string) {
  const first = normalizeSearch(name).charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

export function memberCountLabel(count: number) {
  return `${count} ${count === 1 ? 'member' : 'members'}`;
}
