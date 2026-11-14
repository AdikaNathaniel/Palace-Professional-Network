import '@/global.css';

import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router/stack';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toaster } from 'sonner-native';

import { useNavigationTheme } from '@/hooks/use-navigation-theme';
import { queryClient } from '@/lib/query-client';
import { useSession } from '@/stores/session';
import { useThemePreference } from '@/stores/theme';

SplashScreen.preventAutoHideAsync();

// Android shows chat notifications itself while the app is in the background;
// nothing to do here, but Firebase expects a handler to be set early.
setBackgroundMessageHandler(getMessaging(), async () => {});

export default function RootLayout() {
  const status = useSession((s) => s.status);
  const navigationTheme = useNavigationTheme();

  useEffect(() => {
    void Promise.all([useSession.getState().hydrate(), useThemePreference.getState().hydrate()]);
  }, []);

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  // Keep the splash screen up until we know which side of the guard to show.
  if (status === 'loading') return null;

  const signedIn = status === 'signedIn';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={signedIn}>
                <Stack.Screen name="(app)" />
              </Stack.Protected>
              <Stack.Protected guard={!signedIn}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
            </Stack>
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
