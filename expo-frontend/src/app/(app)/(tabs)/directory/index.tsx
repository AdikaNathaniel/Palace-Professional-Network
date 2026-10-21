import { LegendList } from '@legendapp/list/react-native';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { QueryState } from '@/components/query-state';
import { useDirectory } from '@/hooks/queries';
import type { Biodata } from '@/lib/api/types';

function MemberRow({ member }: { member: Biodata }) {
  return (
    <Link href={{ pathname: '/member/[id]', params: { id: member._id! } }} asChild>
      <Pressable className="flex-row items-center gap-3 bg-background px-4 py-3 active:opacity-70">
        <Avatar name={member.fullName} imageUrl={member.imageUrl} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {member.fullName}
          </Text>
          <Text className="text-sm text-muted" numberOfLines={1}>
            {member.professionSubCategory || member.professionCategory} · {member.placeOfWork}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

// TODO: port search, category filter and grid view from pages/directory_page.dart.
export default function DirectoryScreen() {
  const { data, error, isLoading, isRefetching, refetch } = useDirectory();

  if (!data) {
    return <QueryState isLoading={isLoading} error={error} onRetry={refetch} />;
  }

  return (
    <LegendList
      data={data}
      keyExtractor={(item) => item._id ?? item.phoneNumber}
      renderItem={({ item }) => <MemberRow member={item} />}
      estimatedItemSize={72}
      recycleItems
      refreshing={isRefetching}
      onRefresh={refetch}
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1 }}
      ListEmptyComponent={<QueryState emptyMessage="No members yet." />}
    />
  );
}
