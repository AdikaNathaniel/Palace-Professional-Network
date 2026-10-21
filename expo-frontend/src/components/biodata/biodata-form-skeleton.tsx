import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

const SECTIONS = [4, 2, 2];

/** Placeholder rows shaped like the form while its data loads. */
export function BiodataFormSkeleton() {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      accessibilityLabel="Loading your biodata"
      accessibilityRole="progressbar"
      className="flex-1 gap-6 bg-background px-4 pt-4"
      style={
        reduceMotion
          ? { opacity: 0.7 }
          : {
              animationName: { from: { opacity: 1 }, to: { opacity: 0.45 } },
              animationDuration: '900ms',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
            }
      }>
      <View className="items-center gap-3">
        <View className="size-24 rounded-full bg-surface" />
        <View className="h-4 w-20 rounded-full bg-surface" />
      </View>
      {SECTIONS.map((rows, s) => (
        <View key={s} className="overflow-hidden rounded-xl bg-surface" style={{ borderCurve: 'continuous' }}>
          {Array.from({ length: rows }, (_, r) => (
            <View
              key={r}
              className={`h-12 flex-row items-center justify-between px-4 ${r < rows - 1 ? 'border-b border-border' : ''}`}>
              <View className="h-3.5 w-24 rounded-full bg-border" />
              <View className="h-3.5 w-16 rounded-full bg-border" />
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}
