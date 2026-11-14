import { Stack } from 'expo-router/stack';
import { Pressable } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { PresentationTitle, type PresentationHeaderProps } from '@/components/presentation/presentation-title';
import { Icon } from '@/components/ui/icon';

function SlidesButton({ onPress }: { onPress: () => void }) {
  const accent = useCSSVariable('--color-accent') as string;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="All slides"
      accessibilityHint="Lists every slide so you can jump to one"
      onPress={onPress}
      hitSlop={4}
      className="size-12 items-center justify-center rounded-full active:opacity-60">
      <Icon name={{ ios: 'list.bullet', android: 'format_list_numbered' }} size={24} color={accent} />
    </Pressable>
  );
}

/** Android: the title with the slide count, and a header icon button for the slide list. */
export function PresentationHeader({ index, total, onShowSlides }: PresentationHeaderProps) {
  return (
    <Stack.Screen
      options={{
        headerTitle: () => <PresentationTitle index={index} total={total} />,
        headerRight: () => <SlidesButton onPress={onShowSlides} />,
      }}
    />
  );
}
