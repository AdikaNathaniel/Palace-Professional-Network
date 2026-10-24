import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { Icon } from '@/components/ui/icon';

function StepButton({
  direction,
  disabled,
  onPress,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onPress: () => void;
}) {
  const [accent, border] = useCSSVariable(['--color-accent', '--color-border']) as string[];
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={direction === 'previous' ? 'Previous slide' : 'Next slide'}
      accessibilityState={{ disabled }}
      hitSlop={4}
      className="size-12 items-center justify-center rounded-full active:bg-background">
      <Icon
        name={
          direction === 'previous'
            ? { ios: 'chevron.left', android: 'chevron_left' }
            : { ios: 'chevron.right', android: 'chevron_right' }
        }
        size={22}
        weight="semibold"
        color={disabled ? border : accent}
      />
    </Pressable>
  );
}

/**
 * Previous / next, and in between the current slide's title over a progress
 * bar; tapping the middle opens the slide list.
 */
export function PresentationControls({
  index,
  total,
  title,
  onStep,
  onShowSlides,
}: {
  index: number;
  total: number;
  title: string;
  onStep: (delta: -1 | 1) => void;
  onShowSlides: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const muted = useCSSVariable('--color-muted') as string;
  const progress = `${((index + 1) / total) * 100}%` as const;

  return (
    <View
      className="flex-row items-center gap-1 border-t border-border bg-surface px-2 pt-1.5"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      <StepButton direction="previous" disabled={index === 0} onPress={() => onStep(-1)} />
      <Pressable
        onPress={onShowSlides}
        accessibilityRole="button"
        accessibilityLabel={`${title}, slide ${index + 1} of ${total}`}
        accessibilityHint="Lists every slide so you can jump to one"
        className="flex-1 gap-1.5 rounded-xl px-2 py-1.5 active:bg-background">
        <View className="flex-row items-center justify-center gap-1.5">
          <Text className="shrink text-center text-[13px] font-semibold text-foreground" numberOfLines={1}>
            {title}
          </Text>
          <Icon name={{ ios: 'chevron.up', android: 'expand_less' }} size={11} weight="semibold" color={muted} />
        </View>
        <View className="h-[3px] overflow-hidden rounded-full bg-border">
          {/* Out of flow with no children, so its width can animate cheaply. */}
          <Animated.View
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: progress, transitionProperty: 'width', transitionDuration: reduced ? 0 : 250 }}
          />
        </View>
      </Pressable>
      <StepButton direction="next" disabled={index === total - 1} onPress={() => onStep(1)} />
    </View>
  );
}
