import { useLocalSearchParams } from 'expo-router';

import { PhotoViewer } from '@/components/chat/photo-viewer';

export default function PhotoScreen() {
  const { uri, placeholder, width, height } = useLocalSearchParams<{
    uri: string;
    placeholder?: string;
    width?: string;
    height?: string;
  }>();
  return (
    <PhotoViewer
      uri={uri}
      placeholderUri={placeholder}
      width={width ? Number(width) : undefined}
      height={height ? Number(height) : undefined}
    />
  );
}
