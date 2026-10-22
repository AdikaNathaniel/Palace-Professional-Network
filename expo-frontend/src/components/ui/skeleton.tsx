import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

const PULSE = {
  from: { opacity: 1 },
  to: { opacity: 0.45 },
};

/** A placeholder block that gently pulses while content loads (still, with Reduce Motion on). */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const color = useCSSVariable('--color-border') as string;
  const reduced = useReducedMotion();
  return (
    <Animated.View
      style={[
        { backgroundColor: color, borderRadius: 6, borderCurve: 'continuous' },
        reduced
          ? { opacity: 0.7 }
          : {
              animationName: PULSE,
              animationDuration: '900ms',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
            },
        style,
      ]}
    />
  );
}
