import { useLocalSearchParams } from 'expo-router';

import { ChatScreen } from '@/components/chat/chat-screen';

export default function ChatRoute() {
  const { roomId, title, imageUrl } = useLocalSearchParams<{
    roomId: string;
    title?: string;
    imageUrl?: string;
  }>();
  // Keyed so a different room always gets a fresh connection.
  return <ChatScreen key={roomId} roomId={roomId} titleParam={title} imageParam={imageUrl} />;
}
