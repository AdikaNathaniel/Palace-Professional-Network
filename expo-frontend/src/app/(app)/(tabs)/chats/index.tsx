import { LegendList } from '@legendapp/list/react-native';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChatListRow, type ChatListItem } from '@/components/chat/chat-list-row';
import { QueryState } from '@/components/query-state';
import { useDirectory, useDmRooms, useMyBiodata, useUnreadCounts } from '@/hooks/queries';
import { parseDate } from '@/lib/chat/format';
import { categoryRoomId, professionShortLabel } from '@/lib/chat/rooms';

export default function ChatsScreen() {
  const [search, setSearch] = useState('');
  const mine = useMyBiodata();
  const dms = useDmRooms();
  const unread = useUnreadCounts();
  const directory = useDirectory();
  const [refreshing, setRefreshing] = useState(false);

  const category = mine.data?.professionCategory;
  const memberCount = category
    ? (directory.data ?? []).filter((b) => b.professionCategory === category).length
    : 0;

  const items: ChatListItem[] = [];
  if (category) {
    const label = professionShortLabel(category);
    items.push({
      kind: 'group',
      roomId: categoryRoomId(category),
      title: label,
      subtitle: memberCount
        ? `Group chat · ${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
        : 'Group chat for your profession',
    });
  } else if (mine.isSuccess) {
    items.push({ kind: 'join-group' });
  }
  for (const room of dms.data ?? []) {
    items.push({
      kind: 'dm',
      roomId: room.roomId,
      title: room.otherName || room.otherPhone,
      subtitle: room.lastMessage,
      phone: room.otherPhone,
      imageUrl: room.otherImageUrl,
      at: parseDate(room.lastMessageAt),
    });
  }

  const query = search.trim().toLowerCase();
  const visible = query
    ? items.filter(
        (item) =>
          item.kind !== 'join-group' &&
          (item.title.toLowerCase().includes(query) || item.subtitle.toLowerCase().includes(query)),
      )
    : items;

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([dms.refetch(), unread.refetch(), mine.refetch()]);
    setRefreshing(false);
  };

  if (!dms.data && !mine.data) {
    return (
      <QueryState
        isLoading={dms.isLoading || mine.isLoading}
        error={dms.error ?? mine.error}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <>
      <Stack.SearchBar
        placeholder="Search"
        onChangeText={(e) => setSearch(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearch('')}
      />
      <LegendList
        data={visible}
        extraData={unread.data}
        keyExtractor={(item) => (item.kind === 'join-group' ? 'join-group' : item.roomId)}
        getItemType={(item) => item.kind}
        renderItem={({ item }) => (
          <ChatListRow
            item={item}
            unread={item.kind === 'join-group' ? 0 : (unread.data?.rooms[item.roomId] ?? 0)}
          />
        )}
        estimatedItemSize={76}
        refreshing={refreshing}
        onRefresh={refresh}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        className="bg-background"
        ListEmptyComponent={
          <View className="items-center px-8 py-16">
            <Text className="text-center text-base text-muted">
              {query ? `No chats match “${search.trim()}”.` : 'No conversations yet.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          query ? null : (
            <Text className="px-8 py-6 text-center text-[13px] text-muted">
              To start a conversation, open someone’s profile in the Directory and tap Message.
            </Text>
          )
        }
      />
    </>
  );
}
