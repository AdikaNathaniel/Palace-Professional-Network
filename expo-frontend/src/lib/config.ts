/**
 * The deployed backend by default. Override for local development in
 * `.env.local`:
 *   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000   (Android emulator)
 *   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000  (iOS simulator)
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://palace-professional-network.onrender.com';

/** Turns a server-relative upload path ("/uploads/x.jpg") into a full URL. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
}
