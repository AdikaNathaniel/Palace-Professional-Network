import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';

import { Image } from '@/components/ui/image';

/**
 * The hero photo, drawn behind Home's scroll view. Pulling down stretches it
 * to fill the gap and scrolling up moves it at half speed (with Reduce
 * Motion on it just scrolls with the page). Being behind the scroll view
 * keeps the pull-to-refresh spinner visible on top of it.
 */
export function HeroBackdrop({ scrollY, height }: { scrollY: SharedValue<number>; height: number }) {
  const reduced = useReducedMotion();
  const style = useAnimatedStyle(() => {
    const y = scrollY.get();
    if (reduced) return { transform: [{ translateY: -y }] };
    return {
      transform: [
        { translateY: y > 0 ? -y * 0.5 : 0 },
        { scale: y < 0 ? (height - y) / height : 1 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height, transformOrigin: 'top' }, style]}>
      <Image
        source={require('../../../assets/images/app_icon.png')}
        className="size-full"
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      {/* Keeps the status bar and header buttons readable over the photo. */}
      <LinearGradient
        colors={['rgba(16,10,36,0.55)', 'rgba(16,10,36,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%' }}
      />
      {/* Darkens the bottom so the white title reads over the picture. */}
      <LinearGradient
        colors={['rgba(16,10,36,0)', 'rgba(16,10,36,0.85)']}
        locations={[0.35, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </Animated.View>
  );
}

/**
 * The IPC logo, app name and tagline, laid over the bottom of the hero. At
 * large text sizes it grows taller than `minHeight`; `onHeight` reports how
 * tall it ended up so the photo behind can match.
 */
export function HeroTitle({ minHeight, onHeight }: { minHeight: number; onHeight: (height: number) => void }) {
  return (
    <View
      style={{ minHeight }}
      onLayout={(e) => onHeight(Math.round(e.nativeEvent.layout.height))}
      className="justify-end gap-2 px-5 pb-9 pt-24"
      accessible
      accessibilityRole="header"
      accessibilityLabel="Palace Professional Network. Connecting IPC professionals for mentorship and support">
      <View
        className="w-[88px] rounded-lg bg-white px-1.5 py-1"
        style={{ borderCurve: 'continuous', boxShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
        {/* The logo is drawn for a white background in both themes. */}
        <Image
          source={require('../../../assets/images/ipc_logo.png')}
          style={{ width: '100%', aspectRatio: 608 / 200 }}
          contentFit="contain"
        />
      </View>
      <Text
        className="text-[28px] font-extrabold leading-tight text-white"
        style={{ textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 8 }}
        maxFontSizeMultiplier={1.3}
        numberOfLines={2}>
        Palace Professional Network
      </Text>
      <Text className="text-[15px] leading-snug text-white/90" maxFontSizeMultiplier={1.4} numberOfLines={2}>
        Connecting IPC professionals for mentorship and support
      </Text>
    </View>
  );
}
