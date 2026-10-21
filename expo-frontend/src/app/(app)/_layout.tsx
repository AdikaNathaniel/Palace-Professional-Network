import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { useMyBiodata } from '@/hooks/queries';
import { useChatInbox } from '@/hooks/use-chat-inbox';
import { useSession } from '@/stores/session';

export const unstable_settings = { initialRouteName: '(tabs)' };

/**
 * Members only appear in the directory once they've submitted the biodata
 * form, so anyone without a record is sent to it on every app start until
 * they fill it in. Brand-new accounts skip the reminder and go straight there.
 */
function useBiodataPrompt() {
  const justRegistered = useSession((s) => s.justRegistered);
  const clearJustRegistered = useSession((s) => s.clearJustRegistered);
  const { data: mine, isSuccess } = useMyBiodata();
  const prompted = useRef(false);

  useEffect(() => {
    if (prompted.current) return;
    if (justRegistered) {
      prompted.current = true;
      clearJustRegistered();
      router.push('/biodata-form');
      return;
    }
    // Network/session problems are surfaced by the screens themselves.
    if (!isSuccess || mine) return;
    prompted.current = true;
    Alert.alert(
      'Complete your profile',
      'Please fill in the biodata form. Other members will only see you in the Professional Directory after you submit it.',
      [{ text: 'Fill it in now', onPress: () => router.push('/biodata-form') }],
    );
  }, [justRegistered, clearJustRegistered, isSuccess, mine]);
}

export default function AppLayout() {
  useBiodataPrompt();
  useChatInbox();

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[roomId]" options={{ title: 'Chat' }} />
      <Stack.Screen
        name="chat/photo"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="chat/stickers"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.6, 1],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen name="member/[id]" options={{ title: 'Member' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="change-pin" options={{ title: 'Change PIN' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="presentation" options={{ title: 'PPN Presentation' }} />
      <Stack.Screen name="biodata-form" options={{ title: 'My Biodata', presentation: 'modal' }} />
    </Stack>
  );
}
