import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Share, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
const SETTLE = { duration: 400, dampingRatio: 1 } as const;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

/**
 * A full-screen photo: pinch or double-tap to zoom, drag to pan when zoomed,
 * swipe down to close.
 */
export function PhotoViewer({
  uri,
  placeholderUri,
  width: photoWidth,
  height: photoHeight,
}: {
  uri: string;
  placeholderUri?: string;
  width?: number;
  height?: number;
}) {
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  // The photo's on-screen size at scale 1 (contain-fit), for pan limits.
  const aspect = photoWidth && photoHeight ? photoWidth / photoHeight : window.width / window.height;
  const fitWidth = Math.min(window.width, window.height * aspect);
  const fitHeight = fitWidth / aspect;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const dismissY = useSharedValue(0);
  const chromeVisible = useSharedValue(1);

  const close = () => router.back();
  const toggleChrome = () => chromeVisible.set(withTiming(chromeVisible.get() ? 0 : 1, { duration: 180 }));

  /** How far the photo may move at `s` before showing empty space. */
  const limits = (s: number) => {
    'worklet';
    return {
      x: Math.max(0, (fitWidth * s - window.width) / 2),
      y: Math.max(0, (fitHeight * s - window.height) / 2),
    };
  };

  const settle = (s: number) => {
    'worklet';
    const target = clamp(s, 1, MAX_SCALE);
    const bounds = limits(target);
    scale.set(withSpring(target, SETTLE));
    x.set(withSpring(clamp(x.get(), -bounds.x, bounds.x), SETTLE));
    y.set(withSpring(clamp(y.get(), -bounds.y, bounds.y), SETTLE));
    savedScale.set(target);
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.set(scale.get());
      savedX.set(x.get());
      savedY.set(y.get());
    })
    .onUpdate((e) => {
      const next = clamp(savedScale.get() * e.scale, 0.8, MAX_SCALE * 1.2);
      // Keep the point between the fingers still while zooming.
      const fx = e.focalX - window.width / 2;
      const fy = e.focalY - window.height / 2;
      const ratio = next / savedScale.get();
      scale.set(next);
      x.set(fx - (fx - savedX.get()) * ratio);
      y.set(fy - (fy - savedY.get()) * ratio);
    })
    .onEnd(() => settle(scale.get()));

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onStart(() => {
      savedX.set(x.get());
      savedY.set(y.get());
    })
    .onUpdate((e) => {
      if (savedScale.get() > 1) {
        x.set(savedX.get() + e.translationX);
        y.set(savedY.get() + e.translationY);
      } else {
        dismissY.set(e.translationY);
      }
    })
    .onEnd((e) => {
      if (savedScale.get() > 1) {
        const bounds = limits(scale.get());
        x.set(withSpring(clamp(x.get(), -bounds.x, bounds.x), { ...SETTLE, velocity: e.velocityX }));
        y.set(withSpring(clamp(y.get(), -bounds.y, bounds.y), { ...SETTLE, velocity: e.velocityY }));
        return;
      }
      if (Math.abs(dismissY.get()) > DISMISS_DISTANCE || Math.abs(e.velocityY) > DISMISS_VELOCITY) {
        scheduleOnRN(close);
      } else {
        dismissY.set(withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: e.velocityY }));
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.get() > 1) {
        x.set(withSpring(0, SETTLE));
        y.set(withSpring(0, SETTLE));
        scale.set(withSpring(1, SETTLE));
        savedScale.set(1);
        return;
      }
      // Zoom in on the tapped point.
      const bounds = limits(DOUBLE_TAP_SCALE);
      const tx = (window.width / 2 - e.x) * (DOUBLE_TAP_SCALE - 1);
      const ty = (window.height / 2 - e.y) * (DOUBLE_TAP_SCALE - 1);
      x.set(withSpring(clamp(tx, -bounds.x, bounds.x), SETTLE));
      y.set(withSpring(clamp(ty, -bounds.y, bounds.y), SETTLE));
      scale.set(withSpring(DOUBLE_TAP_SCALE, SETTLE));
      savedScale.set(DOUBLE_TAP_SCALE);
    });

  const singleTap = Gesture.Tap()
    .requireExternalGestureToFail(doubleTap)
    .onEnd(() => scheduleOnRN(toggleChrome));

  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));

  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() + dismissY.get() },
      { scale: scale.get() * (reducedMotion ? 1 : 1 - Math.min(Math.abs(dismissY.get()) / 2000, 0.15)) },
    ],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(dismissY.get()), [0, DISMISS_DISTANCE * 2.5], [1, 0.2], Extrapolation.CLAMP),
  }));
  const chromeStyle = useAnimatedStyle(() => ({
    opacity:
      chromeVisible.get() *
      interpolate(Math.abs(dismissY.get()), [0, DISMISS_DISTANCE], [1, 0], Extrapolation.CLAMP),
  }));

  const share = () => {
    if (uri.startsWith('http')) void Share.share({ url: uri, message: process.env.EXPO_OS === 'android' ? uri : undefined });
  };

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
      <GestureDetector gesture={gesture}>
        <Animated.View className="flex-1 items-center justify-center" style={photoStyle}>
          <Image
            source={{ uri }}
            placeholder={placeholderUri ? { uri: placeholderUri } : undefined}
            placeholderContentFit="contain"
            contentFit="contain"
            style={{ width: fitWidth, height: fitHeight }}
            accessibilityLabel="Photo"
          />
        </Animated.View>
      </GestureDetector>

      <Animated.View
        className="absolute inset-x-0 top-0 flex-row justify-between px-4"
        style={[chromeStyle, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={close}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="size-10 items-center justify-center rounded-full bg-white/15 active:opacity-60">
          <Icon name={{ ios: 'xmark', android: 'close' }} size={16} color="#ffffff" weight="bold" />
        </Pressable>
        {uri.startsWith('http') ? (
          <Pressable
            onPress={share}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share or save"
            className="size-10 items-center justify-center rounded-full bg-white/15 active:opacity-60">
            <Icon name={{ ios: 'square.and.arrow.up', android: 'share' }} size={17} color="#ffffff" weight="semibold" />
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
