import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { useDirectory } from '@/hooks/queries';

export default function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // There's no single-member endpoint; the directory list is already cached.
  const { data } = useDirectory();
  const member = data?.find((m) => m._id === id);

  return (
    <>
      <Stack.Screen options={{ title: member?.fullName ?? 'Member' }} />
      <PlaceholderScreen
        title={member?.fullName ?? 'Member'}
        flutterSource="pages/biodata_detail_page.dart"
      />
    </>
  );
}
