import { Text, View } from 'react-native';

/** "Palace Professional Network" over "Slide 3 of 14", for the navigation bar. */
export function PresentationTitle({ index, total }: { index: number; total: number }) {
  return (
    <View
      className={process.env.EXPO_OS === 'ios' ? 'items-center' : 'items-start'}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`Palace Professional Network, slide ${index + 1} of ${total}`}>
      {/* Native bar titles barely grow with text size; neither does this one. */}
      <Text className="text-[17px] font-semibold text-foreground" maxFontSizeMultiplier={1.3} numberOfLines={1}>
        Palace Professional Network
      </Text>
      <Text className="text-xs text-muted" style={{ fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.3}>
        Slide {index + 1} of {total}
      </Text>
    </View>
  );
}

export type PresentationHeaderProps = { index: number; total: number; onShowSlides: () => void };
