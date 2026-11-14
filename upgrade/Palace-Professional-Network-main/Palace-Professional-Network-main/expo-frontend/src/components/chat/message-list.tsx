import type { LegendListRef } from '@legendapp/list/react-native';
import { KeyboardAwareLegendList } from '@legendapp/list/keyboard';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Pressable, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import {
  MessageRow,
  MessageRowContext,
  type MessageRowContextValue,
  type MessageRowProps,
  type Receipt,
} from '@/components/chat/message-row';
import { Icon } from '@/components/ui/icon';
import { useRoomState } from '@/hooks/use-chat-room';
import type { ChatRoomController, UiMessage } from '@/lib/chat/chat-room';
import { dayLabel, parseDate, sameDay } from '@/lib/chat/format';

/** Consecutive messages from one person this close together share a group. */
const GROUP_GAP_MS = 10 * 60 * 1000;
/** Further than this from the newest message shows the jump-to-bottom button. */
const AWAY_DISTANCE = 300;

type Row =
  | { kind: 'day'; key: string; label: string }
  | ({ kind: 'message'; key: string } & MessageRowProps);

function receiptFor(message: UiMessage, isMine: boolean, isGroup: boolean, otherReadAt: Date | null): Receipt {
  if (!isMine || message.deleted) return 'none';
  if (message.status) return message.status;
  // Group chats don't track who's read what, like the Flutter app.
  if (isGroup) return 'sent';
  const sentAt = parseDate(message.createdAt);
  return otherReadAt && sentAt && sentAt <= otherReadAt ? 'read' : 'sent';
}

function buildRows(
  messages: UiMessage[],
  options: {
    myPhone: string;
    isGroup: boolean;
    otherReadAt: Date | null;
    avatarFor: (phone: string) => string | null | undefined;
  },
): Row[] {
  const { myPhone, isGroup, otherReadAt, avatarFor } = options;
  const rows: Row[] = [];
  const dates = messages.map((m) => parseDate(m.createdAt));

  const grouped = (a: number, b: number) => {
    const ma = messages[a];
    const mb = messages[b];
    const da = dates[a] ?? null;
    const db = dates[b] ?? null;
    return (
      !!ma &&
      !!mb &&
      ma.senderPhone === mb.senderPhone &&
      sameDay(da, db) &&
      !!da &&
      !!db &&
      Math.abs(db.getTime() - da.getTime()) < GROUP_GAP_MS
    );
  };

  messages.forEach((message, i) => {
    const date = dates[i] ?? null;
    if (date && (i === 0 || !sameDay(dates[i - 1] ?? null, date))) {
      rows.push({ kind: 'day', key: `day-${date.toDateString()}`, label: dayLabel(date) });
    }
    const isMine = message.senderPhone === myPhone;
    const withPrevious = i > 0 && grouped(i - 1, i);
    const withNext = i < messages.length - 1 && grouped(i, i + 1);
    rows.push({
      kind: 'message',
      key: message.key,
      message,
      isMine,
      isGroup,
      showSender: isGroup && !isMine && !withPrevious,
      showAvatar: isGroup && !isMine && !withNext,
      avatarUrl: isGroup && !isMine ? avatarFor(message.senderPhone) : undefined,
      groupedWithPrevious: withPrevious,
      groupedWithNext: withNext,
      receipt: receiptFor(message, isMine, isGroup, otherReadAt),
    });
  });
  return rows;
}

const DaySeparator = memo(function DaySeparator({ label }: { label: string }) {
  return (
    <View className="items-center py-3" accessibilityRole="header">
      <Text className="overflow-hidden rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
        {label}
      </Text>
    </View>
  );
});

function renderRow({ item }: { item: Row }) {
  if (item.kind === 'day') return <DaySeparator label={item.label} />;
  const { kind: _kind, key: _key, ...props } = item;
  return <MessageRow {...props} />;
}

export function MessageList({
  controller,
  listRef,
  isGroup,
  myPhone,
  otherPhone,
  avatarFor,
  context,
  composerHeight,
  keyboardOffset,
}: {
  controller: ChatRoomController;
  listRef: RefObject<LegendListRef | null>;
  isGroup: boolean;
  myPhone: string;
  otherPhone: string | null;
  avatarFor: (phone: string) => string | null | undefined;
  /** Row callbacks, minus jump-to-message which the list provides. */
  context: Omit<MessageRowContextValue, 'onJumpTo'>;
  composerHeight: SharedValue<number>;
  keyboardOffset: number;
}) {
  const messages = useRoomState(controller, (s) => s.messages);
  const otherReadAtIso = useRoomState(controller, (s) => (otherPhone ? s.reads[otherPhone] : undefined));

  const rows = useMemo(
    () =>
      buildRows(messages, {
        myPhone,
        isGroup,
        otherReadAt: parseDate(otherReadAtIso),
        avatarFor,
      }),
    [messages, myPhone, isGroup, otherReadAtIso, avatarFor],
  );

  // Read by the stable jump-to callback, so it never changes identity
  // (which would re-render every row through the context).
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const onJumpTo = useCallback(
    (messageId: string) => {
      const index = rowsRef.current.findIndex(
        (r) => r.kind === 'message' && r.message._id === messageId,
      );
      if (index === -1) return;
      void Haptics.selectionAsync();
      void listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.4 });
    },
    [listRef],
  );
  const value = useMemo(() => ({ ...context, onJumpTo }), [context, onJumpTo]);

  // Jump-to-bottom button, with a count of messages that arrived meanwhile.
  const [away, setAway] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement, contentInset } = e.nativeEvent;
    const distance =
      contentSize.height + (contentInset?.bottom ?? 0) - layoutMeasurement.height - contentOffset.y;
    const isAway = distance > AWAY_DISTANCE;
    setAway(isAway);
    if (!isAway) setUnseen(0);
  }, []);

  const last = messages[messages.length - 1];
  const lastKey = last?.key;
  const lastFromOther = !!last && last.senderPhone !== myPhone;
  const awayRef = useRef(away);
  useEffect(() => {
    awayRef.current = away;
  }, [away]);
  useEffect(() => {
    if (lastKey && lastFromOther && awayRef.current) setUnseen((n) => n + 1);
  }, [lastKey, lastFromOther]);

  const scrollToEnd = () => {
    void Haptics.selectionAsync();
    setUnseen(0);
    void listRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <MessageRowContext value={value}>
      <KeyboardAwareLegendList
        ref={listRef}
        data={rows}
        renderItem={renderRow}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.kind}
        estimatedItemSize={56}
        alignItemsAtEnd
        initialScrollAtEnd
        maintainScrollAtEnd
        maintainScrollAtEndThreshold={0.15}
        maintainVisibleContentPosition
        contentInsetEndAdjustment={composerHeight}
        keyboardOffset={keyboardOffset}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{ paddingTop: 8 }}
        style={{ flex: 1 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-1 px-8 py-16">
            <Text className="text-[40px]">👋</Text>
            <Text className="text-base font-semibold text-foreground">No messages yet</Text>
            <Text className="text-center text-sm text-muted">Say hello to start the conversation.</Text>
          </View>
        }
      />
      <ScrollToBottomButton
        visible={away}
        count={unseen}
        composerHeight={composerHeight}
        keyboardOffset={keyboardOffset}
        onPress={scrollToEnd}
      />
    </MessageRowContext>
  );
}

function ScrollToBottomButton({
  visible,
  count,
  composerHeight,
  keyboardOffset,
  onPress,
}: {
  visible: boolean;
  count: number;
  composerHeight: SharedValue<number>;
  keyboardOffset: number;
  onPress: () => void;
}) {
  const accent = useCSSVariable('--color-accent') as string;
  const keyboard = useReanimatedKeyboardAnimation();
  // Rides above the composer, and with it on top of the keyboard.
  const position = useAnimatedStyle(() => ({
    bottom: composerHeight.get() + 12,
    transform: [
      { translateY: Math.min(0, keyboard.height.get() + keyboardOffset * keyboard.progress.get()) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      className="absolute right-3"
      style={position}>
      <Animated.View
        style={{
          opacity: visible ? 1 : 0,
          transform: [{ scale: visible ? 1 : 0.9 }],
          transitionProperty: ['opacity', 'transform'],
          transitionDuration: 180,
        }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={count ? `${count} new messages. Scroll to the latest` : 'Scroll to the latest message'}
          className="size-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
          style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
          <Icon name={{ ios: 'chevron.down', android: 'keyboard_arrow_down' }} size={18} color={accent} weight="semibold" />
          {count > 0 ? (
            <View className="absolute -top-2 min-w-5 items-center rounded-full bg-primary px-1.5 py-0.5">
              <Text className="text-[11px] font-bold text-on-primary" style={{ fontVariant: ['tabular-nums'] }}>
                {count > 99 ? '99+' : count}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
