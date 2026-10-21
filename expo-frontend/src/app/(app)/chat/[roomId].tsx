import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ChatScreen() {
  const { roomId, title } = useLocalSearchParams<{ roomId: string; title?: string }>();
  return (
    <>
      <Stack.Screen options={{ title: title ?? 'Chat' }} />
      <PlaceholderScreen
        title={`Room ${roomId}`}
        flutterSource="pages/chat_page.dart, widgets/chat/*, services/chat_service.dart"
      />
    </>
  );
}
