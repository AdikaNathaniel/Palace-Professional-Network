/**
 * Formatting for the chat screens (times, day separators, presence, file
 * sizes, per-person name colours). Uses the device locale through `Intl`,
 * so times follow the user's 12/24-hour setting.
 */

/**
 * The app polls unread counts every 20s while open, which doubles as the
 * presence heartbeat, so a heartbeat inside this window means "online now".
 */
export const ONLINE_WINDOW_MS = 60_000;

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const shortDateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const longDateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const numericDateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'numeric',
  year: '2-digit',
});

export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole calendar days between `date` and today (0 = today). */
function daysAgo(date: Date) {
  return Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
}

export function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && startOfDay(a) === startOfDay(b);
}

export function formatTime(date: Date | null) {
  return date ? timeFormat.format(date) : '';
}

/** Day separator in a conversation: "Today", "Yesterday", "Monday", "3 March 2026". */
export function dayLabel(date: Date) {
  const diff = daysAgo(date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return weekdayFormat.format(date);
  return longDateFormat.format(date);
}

/** Timestamp in the chats list: a time today, then "Yesterday", a weekday, a date. */
export function listTimestamp(date: Date | null) {
  if (!date) return '';
  const diff = daysAgo(date);
  if (diff === 0) return formatTime(date);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return weekdayFormat.format(date);
  return numericDateFormat.format(date);
}

export function isOnline(lastSeen: Date | null) {
  return !!lastSeen && Date.now() - lastSeen.getTime() < ONLINE_WINDOW_MS;
}

/** "online", "last seen today at 14:05", "last seen 3 Mar at 09:12", or "". */
export function presenceLabel(lastSeen: Date | null) {
  if (!lastSeen) return '';
  if (isOnline(lastSeen)) return 'online';
  const diff = daysAgo(lastSeen);
  const day = diff === 0 ? 'today' : diff === 1 ? 'yesterday' : shortDateFormat.format(lastSeen);
  return `last seen ${day} at ${formatTime(lastSeen)}`;
}

export function fileSize(bytes?: number) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 75_000 -> "1:15". */
export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const NAME_COLORS = [
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#16a34a',
  '#ea580c',
  '#2563eb',
  '#9333ea',
  '#b45309',
];

/** A stable colour per person, like WhatsApp's group sender names. */
export function colorFor(key: string) {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return NAME_COLORS[sum % NAME_COLORS.length]!;
}
