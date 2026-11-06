import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/ui/icon';
import { useRoomState } from '@/hooks/use-chat-room';
import { chatApi } from '@/lib/api/endpoints';
import type { ChatRoomController } from '@/lib/chat/chat-room';
import { parseDate, presenceLabel } from '@/lib/chat/format';
import { queryKeys } from '@/lib/query-client';

/** Presence for a DM header, refreshed while the chat is open. */
export function usePresence(phone: string | null) {
  return useQuery({
    queryKey: queryKeys.presence(phone ?? ''),
    queryFn: () => chatApi.presence(phone!),
    enabled: !!phone,
    refetchInterval: 30_000,
  });
}

function typingLabel(typers: Record<string, string>, isDm: boolean) {
  const names = Object.values(typers);
  if (!names.length) return null;
  if (isDm) return 'typing…';
  return names.length === 1 ? `${names[0]} is typing…` : `${names.length} people are typing…`;
}

/**
 * Avatar, name and a status line: who's typing, otherwise "online" /
 * "last seen …" in a DM or the member count in a group.
 */
export function ChatHeaderTitle({
  controller,
  title,
  imageUrl,
  otherPhone,
  memberCount,
  onPressAvatar,
}: {
  controller: ChatRoomController;
  title: string;
  imageUrl?: string | null;
  otherPhone: string | null;
  memberCount?: number;
  onPressAvatar?: () => void;
}) {
  const isDm = !!otherPhone;
  const [primary, accent] = useCSSVariable(['--color-primary', '--color-accent']) as string[];
  const typers = useRoomState(controller, (s) => s.typers);
  const reconnecting = useRoomState(controller, (s) => s.status === 'ready' && !s.connected);
  const { data: presence } = usePresence(otherPhone);

  const typing = typingLabel(typers, isDm);
  const status =
    typing ??
    (reconnecting
      ? 'Connecting…'
      : isDm
        ? presenceLabel(parseDate(presence?.lastSeenAt))
        : memberCount
          ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
          : 'Group chat');

  return (
    <View
      className="flex-row items-center gap-2.5"
      accessible
      accessibilityRole="header"
      accessibilityLabel={status ? `${title}, ${status}` : title}>
      <Pressable onPress={onPressAvatar} disabled={!onPressAvatar} hitSlop={6}>
        {isDm ? (
          <Avatar name={title} imageUrl={presence?.imageUrl || imageUrl} size={34} />
        ) : (
          <View
            className="size-[34px] items-center justify-center rounded-full"
            style={{ backgroundColor: primary }}>
            <Icon name={{ ios: 'person.3.fill', android: 'groups' }} size={18} color="#ffffff" />
          </View>
        )}
      </Pressable>
      <View className="max-w-60 shrink">
        <Text className="text-[16px] font-semibold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {status ? (
          <Text
            className="text-xs text-muted"
            style={typing ? { color: accent } : undefined}
            numberOfLines={1}>
            {status}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
