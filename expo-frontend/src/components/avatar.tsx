import { Text, View } from 'react-native';

import { Image } from '@/components/ui/image';
import { resolveMediaUrl } from '@/lib/config';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export function Avatar({
  name,
  imageUrl,
  size = 48,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  const uri = resolveMediaUrl(imageUrl);
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full bg-primary-soft"
      style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} className="size-full" contentFit="cover" transition={150} />
      ) : (
        <Text className="font-semibold text-on-primary" style={{ fontSize: size * 0.38 }}>
          {initials(name) || '?'}
        </Text>
      )}
    </View>
  );
}
