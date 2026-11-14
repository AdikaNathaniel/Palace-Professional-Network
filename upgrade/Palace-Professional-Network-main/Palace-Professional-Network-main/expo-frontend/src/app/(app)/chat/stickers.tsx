import { useLocalSearchParams } from 'expo-router';

import { StickerPicker } from '@/components/chat/sticker-picker';

export default function StickersScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  return <StickerPicker roomId={roomId} />;
}
