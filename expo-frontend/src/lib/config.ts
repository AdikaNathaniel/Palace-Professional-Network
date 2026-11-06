/**
 * The deployed backend by default. Override for local development in
 * `.env.local`:
 *   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000   (Android emulator)
 *   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000  (iOS simulator)
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://palace-professional-network.onrender.com';

/**
 * Turns a server-relative upload path ("/uploads/x.jpg") into a full URL.
 * Anything that already has a scheme (https:, or file: for a photo picked
 * on the device) is used as is.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `${API_BASE_URL}${url}`;
}
