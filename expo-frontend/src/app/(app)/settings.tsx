import { Pressable, ScrollView, Text, View } from 'react-native';

import { useThemePreference, type ThemePreference } from '@/stores/theme';

const choices: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Match device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// TODO: port the rest of pages/settings_page.dart (notifications, check for updates).
export default function SettingsScreen() {
  const preference = useThemePreference((s) => s.preference);
  const setPreference = useThemePreference((s) => s.setPreference);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-2 p-4">
      <Text className="px-1 text-sm font-medium uppercase text-muted">Appearance</Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        {choices.map(({ value, label }, i) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: preference === value }}
            onPress={() => void setPreference(value)}
            className={`flex-row items-center justify-between px-4 py-3.5 active:opacity-70 ${i > 0 ? 'border-t border-border' : ''}`}>
            <Text className="text-base text-foreground">{label}</Text>
            {preference === value ? (
              <Text className="text-base font-bold text-primary">✓</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
