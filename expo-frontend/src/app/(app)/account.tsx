import { Link } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import { useMyBiodata } from '@/hooks/queries';
import { useSession } from '@/stores/session';

// TODO: port the rest of pages/account_page.dart (profile summary, delete account link).
export default function AccountScreen() {
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);
  const { data: mine } = useMyBiodata();

  const name = mine?.fullName || session?.fullName || session?.phoneNumber || '';

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will need your phone number and PIN to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      // TODO: unregister this device's push token before the session is cleared.
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4">
      <View className="items-center gap-2 rounded-2xl border border-border bg-surface p-6">
        <Avatar name={name} imageUrl={mine?.imageUrl} size={88} />
        <Text className="text-lg font-semibold text-foreground">{name}</Text>
        <Text className="text-sm text-muted">{session?.phoneNumber}</Text>
      </View>

      <Link href="/biodata-form" asChild>
        <Button title={mine ? 'Edit my biodata' : 'Fill in my biodata'} variant="secondary" />
      </Link>
      <Link href="/settings" asChild>
        <Button title="Settings" variant="secondary" />
      </Link>
      <Link href="/change-pin" asChild>
        <Button title="Change PIN" variant="secondary" />
      </Link>
      <Button title="Sign out" variant="ghost" onPress={confirmSignOut} />
    </ScrollView>
  );
}
