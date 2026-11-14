import { Stack } from 'expo-router/stack';

import { tabStackScreenOptions } from '@/constants/navigation';

export default function Layout() {
  return (
    <Stack screenOptions={tabStackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Chats' }} />
    </Stack>
  );
}
