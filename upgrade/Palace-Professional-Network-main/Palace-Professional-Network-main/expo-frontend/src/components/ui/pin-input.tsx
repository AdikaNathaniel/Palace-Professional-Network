import * as Haptics from 'expo-haptics';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { AccessibilityInfo, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type PinInputHandle = {
  focus: () => void;
  blur: () => void;
  /** Nudges the boxes sideways with an error haptic, e.g. after a wrong PIN. */
  shake: () => void;
};

type PinInputProps = {
  /** What screen readers call the field, e.g. "Current PIN". */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  /** Runs once the last digit is entered (typed or pasted). */
  onComplete?: (value: string) => void;
  error?: string;
  length?: number;
  autoFocus?: boolean;
  editable?: boolean;
  ref?: Ref<PinInputHandle>;
};

const REVEAL_MS = 600;

/**
 * A PIN shown as separate digit boxes. One invisible TextInput laid over the
 * boxes does the typing, so the number pad, backspace, long-press Paste and
 * screen readers all behave like a single secure field.
 */
export function PinInput({
  label,
  value,
  onChangeText,
  onBlur,
  onComplete,
  error,
  length = 4,
  autoFocus,
  editable = true,
  ref,
}: PinInputProps) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  // The digit just typed shows for a moment before turning into a dot.
  const [revealed, setRevealed] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);

  const shake = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // With Reduce Motion on, the red boxes and message carry the error alone.
    if (reduceMotion) return;
    offset.set(
      withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 80 }),
        withTiming(-6, { duration: 70 }),
        withTiming(6, { duration: 70 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  };

  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    blur: () => input.current?.blur(),
    shake,
  }));

  // The message is read out as it appears; the shake is left to the form,
  // on a failed submit, so retyping after an error doesn't set it off again.
  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(error);
  }, [error]);

  useEffect(() => {
    if (revealed === null) return;
    const timer = setTimeout(() => setRevealed(null), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [revealed]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));

  const change = (text: string) => {
    // Pasted codes may carry spaces or dashes; keep the digits only.
    const next = text.replace(/\D/g, '').slice(0, length);
    if (next === value) return;
    setRevealed(next.length > value.length ? next.length - 1 : null);
    onChangeText(next);
    if (next.length === length && value.length < length) onComplete?.(next);
  };

  const active = focused ? Math.min(value.length, length - 1) : -1;

  return (
    <View className="gap-2">
      <Animated.View style={shakeStyle}>
        <View
          className="flex-row justify-center gap-3"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {Array.from({ length }, (_, i) => {
            const digit = value[i];
            const border = error ? 'border-danger' : i === active ? 'border-primary' : 'border-border';
            return (
              <View
                key={i}
                className={`h-14 w-13 items-center justify-center rounded-xl border-2 bg-surface ${border}`}
                style={{ borderCurve: 'continuous' }}>
                {digit === undefined ? null : revealed === i ? (
                  <Text maxFontSizeMultiplier={1.3} className="text-xl font-bold text-foreground">
                    {digit}
                  </Text>
                ) : (
                  <View className="size-3 rounded-full bg-foreground" />
                )}
              </View>
            );
          })}
        </View>
        <TextInput
          ref={input}
          value={value}
          onChangeText={change}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          editable={editable}
          autoFocus={autoFocus}
          keyboardType="number-pad"
          // Not "oneTimeCode": that would offer SMS codes for a PIN.
          textContentType="none"
          autoComplete="off"
          autoCorrect={false}
          secureTextEntry
          maxLength={length * 3}
          caretHidden
          selectionColor="transparent"
          accessibilityLabel={`${label}, ${value.length} of ${length} digits entered`}
          accessibilityHint={error}
          // Covers the boxes so a tap or long-press (Paste) lands on it; the
          // text is transparent, so only the boxes are seen.
          className="absolute inset-0 text-transparent"
          style={{ opacity: 0.02 }}
        />
      </Animated.View>
      {error ? (
        <Text selectable className="text-center text-sm text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
