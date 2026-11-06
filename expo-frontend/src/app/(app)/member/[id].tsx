import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { MemberProfile } from '@/components/member/member-profile';
import { QueryState } from '@/components/query-state';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useDirectory, useMyBiodata } from '@/hooks/queries';
import { useSession } from '@/stores/session';

export default function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const myPhone = useSession((s) => s.session?.phoneNumber);
  // There's no single-member endpoint; the directory list is usually cached.
  const { data, error, isLoading, refetch } = useDirectory();
  const { data: mine } = useMyBiodata();
  const [refetched, setRefetched] = useState(false);
  const asked = useRef(false);

  const found = data?.find((m) => m._id === id);
  const isMe = !!found && found.phoneNumber === myPhone;
  // Your own record updates the moment you save, before the directory refetches.
  const member = isMe && mine ? mine : found;

  // A stale id (or an old cache): look once more before giving up.
  useEffect(() => {
    if (!data || found || asked.current) return;
    asked.current = true;
    void refetch().finally(() => setRefetched(true));
  }, [data, found, refetch]);

  if (member) return <MemberProfile member={member} isMe={isMe} />;
  if (!data || (!refetched && !found)) {
    return <QueryState isLoading={isLoading || !error} error={error} onRetry={refetch} />;
  }
  return <MemberNotFound />;
}

function MemberNotFound() {
  const muted = useCSSVariable('--color-muted') as string;
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
      <Icon name={{ ios: 'person.crop.circle.badge.questionmark', android: 'person_search' }} size={48} color={muted} />
      <Text accessibilityRole="header" className="text-center text-lg font-semibold text-foreground">
        Member not found
      </Text>
      <Text className="text-center text-base text-muted">
        They may have left the directory, or their details have changed.
      </Text>
      <Button title="Back to Directory" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}
