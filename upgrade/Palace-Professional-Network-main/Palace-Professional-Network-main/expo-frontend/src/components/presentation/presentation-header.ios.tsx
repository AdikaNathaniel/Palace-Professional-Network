import { Stack } from 'expo-router/stack';
import { useCSSVariable } from 'uniwind';

import { PresentationTitle, type PresentationHeaderProps } from '@/components/presentation/presentation-title';

/** The title with the slide count, and a native toolbar button for the slide list. */
export function PresentationHeader({ index, total, onShowSlides }: PresentationHeaderProps) {
  const accent = useCSSVariable('--color-accent') as string;
  return (
    <>
      <Stack.Screen options={{ headerTitle: () => <PresentationTitle index={index} total={total} /> }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="list.bullet"
          accessibilityLabel="All slides"
          accessibilityHint="Lists every slide so you can jump to one"
          tintColor={accent}
          onPress={onShowSlides}
        />
      </Stack.Toolbar>
    </>
  );
}
