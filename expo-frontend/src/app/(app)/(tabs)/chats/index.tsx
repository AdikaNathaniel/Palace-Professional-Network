import { LegendList } from '@legendapp/list/react-native';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { QueryState } from '@/components/query-state';
import { useDmRooms, useUnreadCounts } from '@/hooks/queries';
import type { DmRoomPreview } from '@/lib/api/types';

function RoomRow({ room, unread }: { room: DmRoomPreview; unread: number }) {
  return (
    <Link
      href={{ pathname: '/chat/[roomId]', params: { roomId: room.roomId, title: room.otherName } }}
      asChild>
      <Pressable className="flex-row items-center gap-3 bg-background px-4 py-3 active:opacity-70">
        <Avatar name={room.otherName} imageUrl={room.otherImageUrl} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {room.otherName || room.otherPhone}
          </Text>
          <Text className="text-sm text-muted" numberOfLines={1}>
            {room.lastMessage}
          </Text>
        </View>
        {unread > 0 ? (
          <View className="min-w-6 items-center rounded-full bg-primary px-2 py-0.5">
            <Text className="text-xs font-bold text-on-primary">{unread}</Text>
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

// TODO: port the profession group chats and timestamps from pages/chats_list_page.dart.
export default function ChatsScreen() {
  const { data, error, isLoading, isRefetching, refetch } = useDmRooms();
  const { data: unread } = useUnreadCounts();

  if (!data) {
    return <QueryState isLoading={isLoading} error={error} onRetry={refetch} />;
  }

  return (
    <LegendList
      data={data}
      keyExtractor={(item) => item.roomId}
      renderItem={({ item }) => <RoomRow room={item} unread={unread?.rooms[item.roomId] ?? 0} />}
      estimatedItemSize={72}
      recycleItems
      refreshing={isRefetching}
      onRefresh={refetch}
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1 }}
      ListEmptyComponent={<QueryState emptyMessage="No conversations yet." />}
    />
  );
}
