import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'directory_layout';

export type DirectoryLayout = 'list' | 'grid';

type DirectoryLayoutState = {
  layout: DirectoryLayout;
  setLayout: (layout: DirectoryLayout) => void;
};

/** Whether the Directory shows rows or cards, remembered on the device. */
export const useDirectoryLayout = create<DirectoryLayoutState>()((set) => ({
  layout: 'list',

  setLayout: (layout) => {
    set({ layout });
    AsyncStorage.setItem(STORAGE_KEY, layout).catch(() => {
      // Applied for this session even if it couldn't be saved.
    });
  },
}));

// Read at startup (route modules load with the app), well before the
// Directory tab is first opened, so it never flashes the other layout.
AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => {
    if (saved === 'list' || saved === 'grid') useDirectoryLayout.setState({ layout: saved });
  })
  .catch(() => {
    // Keep the default.
  });
