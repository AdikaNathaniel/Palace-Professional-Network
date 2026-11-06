import * as Haptics from 'expo-haptics';
import { Pressable, Text } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';

/** A Contacts-style action button: icon over a short label. */
export function ActionTile({
  label,
  icon,
  color,
  onPress,
  accessibilityHint,
  className = 'bg-surface',
}: {
  label: string;
  icon: IconName;
  color: string;
  onPress: () => void;
  accessibilityHint?: string;
  /** The tile's background; surface by default. */
  className?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={{ borderCurve: 'continuous' }}
      className={`min-h-16 flex-1 items-center justify-center gap-1 rounded-xl px-1 py-2 active:opacity-60 ${className}`}>
      <Icon name={icon} size={20} color={color} />
      <Text className="text-center text-xs font-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}
