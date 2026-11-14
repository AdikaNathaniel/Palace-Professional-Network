import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { ApiError } from '@/lib/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        // A 4xx won't fix itself on retry; network blips might.
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 2,
    },
  },
});

// Refetch stale queries when the app comes back to the foreground, like the
// Flutter app's resume handler did.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    focusManager.setFocused(state === 'active');
  });
}

export const queryKeys = {
  biodataOptions: ['biodata', 'options'] as const,
  myBiodata: ['biodata', 'me'] as const,
  directory: ['biodata', 'list'] as const,
  dmRooms: ['chat', 'dm-rooms'] as const,
  unread: ['chat', 'unread'] as const,
  presence: (phone: string) => ['chat', 'presence', phone] as const,
};
