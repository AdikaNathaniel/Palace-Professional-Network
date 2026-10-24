import { FieldGroup, Host, ListItem, Text } from '@expo/ui';
import { router } from 'expo-router';
import { Alert, View } from 'react-native';
import { useUniwind } from 'uniwind';

import { Chevron, RowIcon, SettingsRow } from '@/components/account/settings-rows';
import { Avatar } from '@/components/avatar';
import { a11y, formModifiers, headlineFont, sectionModifiers } from '@/components/forms/form-modifiers';
import { useFormColors } from '@/components/forms/form-rows';
import { useMyBiodata } from '@/hooks/queries';
import { useSession } from '@/stores/session';

export default function AccountScreen() {
  const colors = useFormColors();
  const { theme } = useUniwind();
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);
  const { data: mine } = useMyBiodata();

  const name = mine?.fullName || session?.fullName || session?.phoneNumber || '';
  const phone = session?.phoneNumber ?? '';

  // Members with a biodata see their directory profile; others fill it in.
  const openProfile = () =>
    mine?._id
      ? router.push({ pathname: '/member/[id]', params: { id: mine._id } })
      : router.push('/biodata-form');

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will need your phone number and PIN to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      // TODO: unregister this device's push token before the session is cleared.
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <View className="flex-1 bg-background">
      <Host style={{ flex: 1 }} colorScheme={theme === 'dark' ? 'dark' : 'light'}>
        <FieldGroup modifiers={formModifiers(colors.accent)}>
          <FieldGroup.Section modifiers={sectionModifiers(colors.surface)}>
            <ListItem
              onPress={openProfile}
              modifiers={a11y(
                [name, phone, mine?.professionCategory].filter(Boolean).join(', '),
                mine ? 'Opens your profile' : 'Opens the biodata form',
              )}
              leading={<Avatar name={name} imageUrl={mine?.imageUrl} size={60} />}
              supportingText={
                <Text textStyle={{ color: colors.muted }}>
                  {[phone, mine?.professionCategory ?? 'Add your biodata to join the directory']
                    .filter(Boolean)
                    .join('\n')}
                </Text>
              }
              trailing={<Chevron colors={colors} />}>
              <Text textStyle={{ color: colors.foreground, fontWeight: '600' }} modifiers={headlineFont()}>
                {name}
              </Text>
            </ListItem>
          </FieldGroup.Section>

          <FieldGroup.Section modifiers={sectionModifiers(colors.surface)}>
            <SettingsRow
              title="My Biodata"
              icon={<RowIcon name={{ ios: 'person.text.rectangle.fill', android: 'badge' }} color={colors.primary} />}
              colors={colors}
              onPress={() => router.push('/biodata-form')}
            />
            <SettingsRow
              title="Notifications"
              icon={<RowIcon name={{ ios: 'bell.fill', android: 'notifications' }} color={colors.danger} />}
              colors={colors}
              onPress={() => router.push('/notifications')}
            />
            <SettingsRow
              title="PPN Presentation"
              icon={<RowIcon name={{ ios: 'play.rectangle.fill', android: 'slideshow' }} color={colors.accent} />}
              colors={colors}
              onPress={() => router.push('/presentation')}
            />
            <SettingsRow
              title="Settings"
              icon={<RowIcon name={{ ios: 'gearshape.fill', android: 'settings' }} color={colors.muted} />}
              colors={colors}
              onPress={() => router.push('/settings')}
            />
          </FieldGroup.Section>

          <FieldGroup.Section modifiers={sectionModifiers(colors.surface)}>
            <SettingsRow
              title="Sign Out"
              kind="destructive"
              colors={colors}
              accessibilityHint="Asks to confirm first"
              onPress={confirmSignOut}
            />
          </FieldGroup.Section>

          <FieldGroup.Section modifiers={sectionModifiers(colors.surface)}>
            <SettingsRow
              title="Delete Account"
              detail="See what’s removed and email a deletion request"
              kind="destructive"
              colors={colors}
              onPress={() => router.push('/delete-account')}
            />
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </View>
  );
}
