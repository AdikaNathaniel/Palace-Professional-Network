import AsyncStorage from '@react-native-async-storage/async-storage';
import { Uniwind } from 'uniwind';
import { create } from 'zustand';

const STORAGE_KEY = 'theme_preference';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeState = {
  preference: ThemePreference;
  hydrate: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

/** The Appearance choice in Settings, remembered on the device. */
export const useThemePreference = create<ThemeState>()((set) => ({
  preference: 'system',

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        Uniwind.setTheme(saved);
        set({ preference: saved });
      }
    } catch {
      // Keep following the system theme.
    }
  },

  setPreference: async (preference) => {
    Uniwind.setTheme(preference);
    set({ preference });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Applied for this session even if it couldn't be saved.
    }
  },
}));
