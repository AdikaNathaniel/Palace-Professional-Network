import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { configureApiAuth } from '@/lib/api/client';
import type { UserSession } from '@/lib/api/types';
import { queryClient } from '@/lib/query-client';

const STORAGE_KEY = 'session';

type SessionState = {
  /** `loading` until the saved session has been read at startup. */
  status: 'loading' | 'signedIn' | 'signedOut';
  session: UserSession | null;
  /** True right after sign-up, so the app opens the biodata form first. */
  justRegistered: boolean;

  hydrate: () => Promise<void>;
  signIn: (session: UserSession, options?: { justRegistered?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  clearJustRegistered: () => void;
};

export const useSession = create<SessionState>()((set, get) => ({
  status: 'loading',
  session: null,
  justRegistered: false,

  hydrate: async () => {
    let session: UserSession | null = null;
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY);
      if (saved) session = JSON.parse(saved) as UserSession;
    } catch {
      // Unreadable (e.g. keychain reset after a reinstall): sign in again.
    }
    set({ session, status: session?.token ? 'signedIn' : 'signedOut' });
  },

  signIn: async (session, options) => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
    set({ session, status: 'signedIn', justRegistered: options?.justRegistered ?? false });
  },

  signOut: async () => {
    if (get().status === 'signedOut') return;
    set({ session: null, status: 'signedOut', justRegistered: false });
    // Don't leave the previous member's directory or chats in the cache.
    queryClient.clear();
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  },

  clearJustRegistered: () => set({ justRegistered: false }),
}));

configureApiAuth({
  getToken: () => useSession.getState().session?.token ?? null,
  onUnauthorized: () => void useSession.getState().signOut(),
});
