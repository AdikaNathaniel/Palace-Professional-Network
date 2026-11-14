import { FieldGroup, Host } from '@expo/ui';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';
import { useUniwind } from 'uniwind';

import { RowIcon, RowSpinner, SettingsRow, ValueRow } from '@/components/account/settings-rows';
import { formModifiers, sectionModifiers } from '@/components/forms/form-modifiers';
import { SectionNote, useFormColors } from '@/components/forms/form-rows';
import { Icon, type IconName } from '@/components/ui/icon';
import { checkForUpdate, updateCheck } from '@/lib/app-update';
import { currentVersion, type UpdateCheckResult } from '@/lib/app-version';
import { useThemePreference, type ThemePreference } from '@/stores/theme';

const themes: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'system', label: 'Match Device', icon: { ios: 'circle.lefthalf.filled', android: 'contrast' } },
  { value: 'light', label: 'Light', icon: { ios: 'sun.max.fill', android: 'light_mode' } },
  { value: 'dark', label: 'Dark', icon: { ios: 'moon.fill', android: 'dark_mode' } },
];

const updateMessages: Record<UpdateCheckResult, string> = {
  upToDate: 'You have the latest version.',
  updating: 'Updating…',
  cancelled: 'Update cancelled.',
  openedStore: `Opening ${updateCheck.store}…`,
  failed: 'Could not check for updates. Please try again later.',
};

export default function SettingsScreen() {
  const colors = useFormColors();
  const { theme } = useUniwind();
  const preference = useThemePreference((s) => s.preference);
  const setPreference = useThemePreference((s) => s.setPreference);
  const [checking, setChecking] = useState(false);

  const chooseTheme = (value: ThemePreference) => {
    if (value === preference) return;
    void Haptics.selectionAsync();
    void setPreference(value);
  };

  const check = async () => {
    setChecking(true);
    const result = await checkForUpdate();
    setChecking(false);
    const message = updateMessages[result];
    if (result === 'failed') toast.error(message);
    else toast(message);
  };

  return (
    <View className="flex-1 bg-background">
      <Host style={{ flex: 1 }} colorScheme={theme === 'dark' ? 'dark' : 'light'}>
        <FieldGroup modifiers={formModifiers(colors.accent)}>
          <FieldGroup.Section title="Security" modifiers={sectionModifiers(colors.surface)}>
            <SettingsRow
              title="Change PIN"
              detail="Update the PIN you use to sign in"
              icon={<RowIcon name={{ ios: 'lock.fill', android: 'lock' }} color={colors.primary} />}
              colors={colors}
              onPress={() => router.push('/change-pin')}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title="Appearance" modifiers={sectionModifiers(colors.surface)}>
            {themes.map(({ value, label, icon }) => (
              <SettingsRow
                key={value}
                title={label}
                icon={<Icon name={icon} size={20} color={colors.accent} />}
                colors={colors}
                kind="option"
                selected={preference === value}
                trailing={
                  preference === value ? (
                    <Icon name={{ ios: 'checkmark', android: 'check' }} size={16} weight="semibold" color={colors.accent} />
                  ) : undefined
                }
                onPress={() => chooseTheme(value)}
              />
            ))}
          </FieldGroup.Section>

          <FieldGroup.Section title="About" modifiers={sectionModifiers(colors.surface)}>
            <ValueRow title="Version" value={currentVersion()} colors={colors} />
            <SettingsRow
              title="Check for Updates"
              icon={
                <RowIcon
                  name={{ ios: 'arrow.down.circle.fill', android: 'system_update' }}
                  color={updateCheck.available ? colors.primary : colors.muted}
                />
              }
              colors={colors}
              kind="action"
              trailing={checking ? <RowSpinner /> : undefined}
              onPress={updateCheck.available && !checking ? () => void check() : undefined}
            />
            {updateCheck.available ? null : (
              <SectionNote colors={colors}>
                Update checks will work here once the app is on the App Store. Until then, new versions arrive the
                way you installed this one.
              </SectionNote>
            )}
          </FieldGroup.Section>

          <FieldGroup.Section title="Privacy" modifiers={sectionModifiers(colors.surface)}>
            <SettingsRow
              title="Privacy Policy"
              icon={<RowIcon name={{ ios: 'hand.raised.fill', android: 'privacy_tip' }} color={colors.accent} />}
              colors={colors}
              onPress={() => router.push('/privacy')}
            />
            <SettingsRow
              title="Deleting Your Account"
              icon={<RowIcon name={{ ios: 'trash.fill', android: 'delete' }} color={colors.danger} />}
              colors={colors}
              onPress={() => router.push('/delete-account')}
            />
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </View>
  );
}
