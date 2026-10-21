import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  className?: string;
};

const containers = {
  primary: 'bg-primary',
  secondary: 'bg-surface border border-border',
  ghost: 'bg-transparent',
};

const labels = {
  primary: 'text-on-primary',
  secondary: 'text-foreground',
  ghost: 'text-accent',
};

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  className = '',
  onPress,
  ...rest
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      className={`h-14 flex-row items-center justify-center rounded-2xl px-6 active:opacity-80 ${containers[variant]} ${inactive ? 'opacity-60' : ''} ${className}`}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : undefined} />
      ) : (
        <Text className={`text-base font-semibold ${labels[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
