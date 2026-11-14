/**
 * Rows for the Account and Settings lists, built on @expo/ui's ListItem
 * inside a FieldGroup (a SwiftUI Form on iOS, Compose on Android). Titles
 * use the system body font, so they grow with the text-size setting.
 */
import { ListItem, Text } from '@expo/ui';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { a11y } from '@/components/forms/form-modifiers';
import type { FormColors } from '@/components/forms/form-rows';
import { Icon, type IconName } from '@/components/ui/icon';

/** A white symbol on a coloured rounded square, like the Settings app. */
export function RowIcon({ name, color }: { name: IconName; color: string }) {
  return (
    <View
      className="size-[30px] items-center justify-center rounded-[7px]"
      style={{ backgroundColor: color, borderCurve: 'continuous' }}>
      <Icon name={name} size={17} color="#ffffff" />
    </View>
  );
}

const chevron = { ios: 'chevron.right', android: 'chevron_right' } as const;

export function Chevron({ colors }: { colors: FormColors }) {
  return (
    <View className="size-5 items-center justify-center">
      <Icon name={chevron} size={14} weight="semibold" color={colors.muted} />
    </View>
  );
}

export function RowSpinner() {
  return (
    <View className="size-5 items-center justify-center">
      <ActivityIndicator />
    </View>
  );
}

/**
 * A tappable row. `kind` sets what it looks like: `link` opens another
 * screen (chevron), `action` does something here (accent title), `option`
 * is one of a set of choices, and `destructive` is red. Without `onPress` the row is greyed out.
 */
export function SettingsRow({
  title,
  detail,
  icon,
  kind = 'link',
  trailing,
  onPress,
  selected,
  colors,
  accessibilityHint,
}: {
  title: string;
  detail?: string;
  icon?: ReactNode;
  kind?: 'link' | 'action' | 'option' | 'destructive';
  trailing?: ReactNode;
  onPress?: () => void;
  /** For `option` rows: read out as "…, selected". */
  selected?: boolean;
  colors: FormColors;
  accessibilityHint?: string;
}) {
  const color = !onPress
    ? colors.muted
    : kind === 'destructive'
      ? colors.danger
      : kind === 'action'
        ? colors.accent
        : colors.foreground;
  return (
    <ListItem
      onPress={onPress}
      leading={icon}
      modifiers={a11y(
        [title, detail, selected ? 'selected' : undefined].filter(Boolean).join(', '),
        onPress ? accessibilityHint : 'Not available',
      )}
      supportingText={detail ? <Text textStyle={{ color: colors.muted }}>{detail}</Text> : undefined}
      trailing={trailing ?? (kind === 'link' && onPress ? <Chevron colors={colors} /> : undefined)}>
      <Text textStyle={{ color }}>{title}</Text>
    </ListItem>
  );
}

/** A read-only "Title … value" row, e.g. the app version. */
export function ValueRow({ title, value, colors }: { title: string; value: string; colors: FormColors }) {
  return (
    <ListItem
      modifiers={a11y(`${title}, ${value}`)}
      trailing={<Text textStyle={{ color: colors.muted }}>{value}</Text>}>
      <Text textStyle={{ color: colors.foreground }}>{title}</Text>
    </ListItem>
  );
}
