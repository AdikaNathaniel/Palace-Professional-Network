import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { BlockView, type JumpHandler } from '@/components/presentation/slide-blocks';
import type { Slide } from '@/lib/presentation';

/** One slide: its header, then its content, scrolling if taller than the screen. */
export function SlideView({ slide, onJump }: { slide: Slide; onJump: JumpHandler }) {
  const { width, fontScale } = useWindowDimensions();
  return (
    <ScrollView
      // React Native keeps text measured at the old size when the system
      // text size changes; a fresh layout fixes it.
      key={fontScale}
      nestedScrollEnabled
      contentContainerClassName="items-center px-4 pb-6 pt-5"
      // Cover slides sit in the middle of the page when they fit.
      contentContainerStyle={slide.cover ? { flexGrow: 1, justifyContent: 'center' } : undefined}>
      {/* A readable width on tablets. */}
      <View className="gap-3" style={{ width: Math.min(width - 32, 680) }}>
        {slide.cover ? null : (
          <View className="mb-1 gap-1">
            {slide.kicker ? (
              <Text className="text-xs font-bold uppercase tracking-wider text-primary">{slide.kicker}</Text>
            ) : null}
            <Text accessibilityRole="header" className="text-[22px] font-extrabold leading-7 text-accent">
              {slide.title}
            </Text>
          </View>
        )}
        {slide.blocks.map((block, i) => (
          <BlockView key={i} block={block} onJump={onJump} />
        ))}
      </View>
    </ScrollView>
  );
}
