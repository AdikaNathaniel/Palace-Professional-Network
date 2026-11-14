import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import { useCSSVariable } from 'uniwind';

import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/ui/icon';
import { listTimestamp } from '@/lib/chat/format';

export type ChatListItem =
  | { kind: 'group'; roomId: string; title: string; subtitle: string }
  | {
      kind: 'dm';
      roomId: string;
      title: string;
      subtitle: string;
      phone: string;
      imageUrl?: string | null;
      at: Date | null;
    }
  /** No biodata yet, so no profession group to show. */
  | { kind: 'join-group' };

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View
      className="min-w-[22px] items-center rounded-full bg-primary px-1.5 py-0.5"
      accessibilityLabel={`${count} unread`}>
      <Text className="text-xs font-bold text-on-primary" style={{ fontVariant: ['tabular-nums'] }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

function RowBody({
  item,
  unread,
}: {
  item: Exclude<ChatListItem, { kind: 'join-group' }>;
  unread: number;
}) {
  const primary = useCSSVariable('--color-primary') as string;
  const time = item.kind === 'dm' ? listTimestamp(item.at) : '';
  return (
    <View className="flex-row items-center gap-3 px-4 py-2.5">
      {item.kind === 'dm' ? (
        <Avatar name={item.title} imageUrl={item.imageUrl} size={52} />
      ) : (
        <View
          className="size-[52px] items-center justify-center rounded-full"
          style={{ backgroundColor: primary }}>
          <Icon name={{ ios: 'person.3.fill', android: 'groups' }} size={24} color="#ffffff" />
        </View>
      )}
      <View className="flex-1 gap-0.5 border-b border-border py-1.5">
        <View className="flex-row items-center gap-2">
          <Text
            className={`flex-1 text-[17px] text-foreground ${unread ? 'font-bold' : 'font-semibold'}`}
            numberOfLines={1}>
            {item.title}
          </Text>
          {item.kind === 'group' ? (
            <Icon name={{ ios: 'pin.fill', android: 'push_pin' }} size={12} color={primary} />
          ) : null}
          {time ? (
            <Text className={`text-sm ${unread ? 'font-semibold text-accent' : 'text-muted'}`}>{time}</Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          <Text
            className={`flex-1 text-[15px] ${unread ? 'text-foreground' : 'text-muted'}`}
            numberOfLines={2}>
            {item.subtitle || ' '}
          </Text>
          <UnreadBadge count={unread} />
        </View>
      </View>
    </View>
  );
}

/** One row in the chats list; DMs get a long-press menu on iOS. */
export const ChatListRow = memo(function ChatListRow({
  item,
  unread,
}: {
  item: ChatListItem;
  unread: number;
}) {
  if (item.kind === 'join-group') {
    return (
      <Link href="/biodata-form" asChild>
        <Pressable className="mx-4 my-2 flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4 active:opacity-70">
          <Icon name={{ ios: 'person.3', android: 'groups' }} size={24} color="#7c3aed" />
          <Text className="flex-1 text-[15px] text-foreground">
            Submit your biodata to join your profession’s group chat.
          </Text>
        </Pressable>
      </Link>
    );
  }

  const href = {
    pathname: '/chat/[roomId]' as const,
    params: {
      roomId: item.roomId,
      title: item.title,
      ...(item.kind === 'dm' && item.imageUrl ? { imageUrl: item.imageUrl } : {}),
    },
  };
  const label = `${item.title}${unread ? `, ${unread} unread` : ''}. ${item.subtitle}`;

  if (item.kind === 'group') {
    return (
      <Link href={href} asChild>
        <Pressable className="active:bg-surface" accessibilityLabel={label}>
          <RowBody item={item} unread={unread} />
        </Pressable>
      </Link>
    );
  }

  const copyPhone = async () => {
    await Clipboard.setStringAsync(item.phone);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Phone number copied');
  };

  return (
    <Link href={href} asChild>
      <Link.Trigger>
        <Pressable className="active:bg-surface" accessibilityLabel={label}>
          <RowBody item={item} unread={unread} />
        </Pressable>
      </Link.Trigger>
      <Link.Menu>
        <Link.MenuAction title="Call" icon="phone" onPress={() => void Linking.openURL(`tel:${item.phone}`)} />
        <Link.MenuAction title="Copy Phone Number" icon="doc.on.doc" onPress={() => void copyPhone()} />
      </Link.Menu>
    </Link>
  );
});
