import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { createContext, memo, use } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Avatar } from '@/components/avatar';
import { LinkedText } from '@/components/chat/linked-text';
import { PollCard } from '@/components/chat/poll-card';
import { VoicePlayer } from '@/components/chat/voice-player';
import { Icon, type IconName } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import type { ChatAttachment, ChatReaction, ChatReply } from '@/lib/api/types';
import { captionOf, type UiMessage } from '@/lib/chat/chat-room';
import { colorFor, fileSize, formatTime, parseDate } from '@/lib/chat/format';

export type Receipt = 'none' | 'pending' | 'failed' | 'sent' | 'read';

export type ChatThemeColors = {
  primary: string;
  onPrimary: string;
  accent: string;
  muted: string;
  danger: string;
};

/** Everything a row needs that isn't about its own message, kept stable so rows stay memoized. */
export type MessageRowContextValue = {
  myPhone: string;
  colors: ChatThemeColors;
  onLongPress: (key: string) => void;
  onReply: (key: string) => void;
  onRetry: (key: string) => void;
  onVote: (key: string, optionIds: string[]) => void;
  onShowReactions: (key: string) => void;
  onShowVotes: (key: string) => void;
  onOpenImage: (message: UiMessage) => void;
  onJumpTo: (messageId: string) => void;
};

export const MessageRowContext = createContext<MessageRowContextValue | null>(null);

const REPLY_THRESHOLD = 64;
const READ_TICK = '#7dd3fc';

export type MessageRowProps = {
  message: UiMessage;
  isMine: boolean;
  /** Group chats show names and avatars for other people. */
  isGroup: boolean;
  showSender: boolean;
  showAvatar: boolean;
  avatarUrl?: string | null;
  groupedWithPrevious: boolean;
  groupedWithNext: boolean;
  receipt: Receipt;
};

export const MessageRow = memo(function MessageRow({
  message,
  isMine,
  isGroup,
  showSender,
  showAvatar,
  avatarUrl,
  groupedWithPrevious,
  groupedWithNext,
  receipt,
}: MessageRowProps) {
  const ctx = use(MessageRowContext)!;
  const translateX = useSharedValue(0);
  const pressed = useSharedValue(0);

  const canSwipe = !message.deleted && !message.status;
  const canLongPress = !message.deleted && message.status !== 'pending';
  const reply = () => ctx.onReply(message.key);
  const longPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ctx.onLongPress(message.key);
  };
  const thresholdHaptic = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // Swipe right to reply, like WhatsApp; rubber-bands past the threshold.
  const pan = Gesture.Pan()
    .enabled(canSwipe)
    .activeOffsetX(14)
    .failOffsetX(-14)
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const x = Math.max(0, e.translationX);
      translateX.set(x <= REPLY_THRESHOLD ? x : REPLY_THRESHOLD + (x - REPLY_THRESHOLD) * 0.25);
    })
    .onEnd((e) => {
      if (translateX.get() >= REPLY_THRESHOLD) scheduleOnRN(reply);
      translateX.set(withSpring(0, { duration: 400, dampingRatio: 0.8, velocity: e.velocityX }));
    });

  const hold = Gesture.LongPress()
    .enabled(canLongPress)
    .minDuration(350)
    .onBegin(() => pressed.set(withTiming(1, { duration: 150 })))
    .onStart(() => scheduleOnRN(longPress))
    .onFinalize(() => pressed.set(withTiming(0, { duration: 150 })));

  useAnimatedReaction(
    () => translateX.get() >= REPLY_THRESHOLD,
    (reached, previous) => {
      if (reached && previous === false) scheduleOnRN(thresholdHaptic);
    },
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { scale: 1 - pressed.get() * 0.04 }],
  }));
  const replyIconStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.get(), [0, REPLY_THRESHOLD], [0, 1], Extrapolation.CLAMP);
    return { opacity: progress, transform: [{ scale: 0.6 + progress * 0.4 }] };
  });

  const isSticker = message.type === 'sticker' && !message.deleted;
  const isBareImage =
    message.type === 'image' && !message.deleted && !!message.attachment && !captionOf(message);
  const big = 18;
  const small = 5;
  const corners = isMine
    ? {
        borderTopRightRadius: groupedWithPrevious ? small : big,
        borderBottomRightRadius: groupedWithNext ? small : big,
        borderTopLeftRadius: big,
        borderBottomLeftRadius: big,
      }
    : {
        borderTopLeftRadius: groupedWithPrevious ? small : big,
        borderBottomLeftRadius: groupedWithNext ? small : big,
        borderTopRightRadius: big,
        borderBottomRightRadius: big,
      };

  const bubbleClass = isSticker
    ? ''
    : isMine
      ? 'bg-primary'
      : 'bg-surface border border-border';
  const padding = isSticker ? '' : isBareImage || message.type === 'image' ? 'p-1' : 'px-3 py-2';

  return (
    <GestureDetector gesture={Gesture.Race(pan, hold)}>
      <View className={groupedWithNext ? 'px-3 pb-0.5' : 'px-3 pb-2'}>
        <Animated.View
          style={replyIconStyle}
          className="absolute inset-y-0 left-3 justify-center"
          pointerEvents="none">
          <View className="size-8 items-center justify-center rounded-full bg-surface">
            <Icon
              name={{ ios: 'arrowshape.turn.up.left.fill', android: 'reply' }}
              size={16}
              color={ctx.colors.accent}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={rowStyle}
          className={`flex-row items-end gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
          {isGroup && !isMine ? (
            <View className="w-7">
              {showAvatar ? (
                <Avatar name={message.senderName || message.senderPhone} imageUrl={avatarUrl} size={28} />
              ) : null}
            </View>
          ) : null}

          {receipt === 'failed' ? (
            <Pressable
              onPress={() => ctx.onRetry(message.key)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Message not sent. Tap to retry"
              className="mb-2 active:opacity-60">
              <Icon
                name={{ ios: 'exclamationmark.circle.fill', android: 'error' }}
                size={22}
                color={ctx.colors.danger}
              />
            </Pressable>
          ) : null}

          <View className={`max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}>
            <View
              className={`overflow-hidden ${bubbleClass} ${padding}`}
              style={{ ...corners, borderCurve: 'continuous', opacity: message.status === 'pending' ? 0.85 : 1 }}>
              {showSender ? (
                <Text
                  className={`text-[13px] font-semibold ${message.type === 'image' ? 'px-2 pt-1' : ''}`}
                  style={{ color: colorFor(message.senderPhone) }}
                  numberOfLines={1}>
                  {message.senderName || message.senderPhone}
                </Text>
              ) : null}
              {message.replyTo && !message.deleted ? (
                <ReplyQuote
                  reply={message.replyTo}
                  isMine={isMine}
                  myPhone={ctx.myPhone}
                  padded={message.type === 'image'}
                  onPress={() => ctx.onJumpTo(message.replyTo!.messageId)}
                />
              ) : null}
              <MessageContent message={message} isMine={isMine} receipt={receipt} />
            </View>
            {message.reactions?.length ? (
              <ReactionsChip
                reactions={message.reactions}
                onPress={() => ctx.onShowReactions(message.key)}
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

function MessageContent({
  message,
  isMine,
  receipt,
}: {
  message: UiMessage;
  isMine: boolean;
  receipt: Receipt;
}) {
  const ctx = use(MessageRowContext)!;
  const fg = isMine ? 'text-on-primary' : 'text-foreground';
  const iconColor = isMine ? ctx.colors.onPrimary : ctx.colors.accent;
  const meta = <Meta message={message} isMine={isMine} receipt={receipt} />;
  const { attachment } = message;
  const caption = captionOf(message);

  if (message.deleted) {
    return (
      <View className="flex-row flex-wrap items-end">
        <View className="flex-row items-center gap-1.5">
          <Icon
            name={{ ios: 'nosign', android: 'block' }}
            size={14}
            color={isMine ? ctx.colors.onPrimary : ctx.colors.muted}
          />
          <Text className={`text-[15px] italic ${isMine ? 'text-on-primary/80' : 'text-muted'}`}>
            {isMine ? 'You deleted this message' : 'This message was deleted'}
          </Text>
        </View>
        {meta}
      </View>
    );
  }

  if (message.type === 'poll' && message.poll) {
    return (
      <View className="gap-1">
        <PollCard
          poll={message.poll}
          myPhone={ctx.myPhone}
          isMine={isMine}
          accent={iconColor}
          disabled={!!message.status}
          onVote={(ids) => ctx.onVote(message.key, ids)}
          onViewVotes={() => ctx.onShowVotes(message.key)}
        />
        <View className="self-end">{meta}</View>
      </View>
    );
  }

  if (message.type === 'image' && attachment) {
    return (
      <View>
        <ImageContent message={message} attachment={attachment} />
        {caption ? (
          <View className="flex-row flex-wrap items-end px-2 pb-1 pt-1.5">
            <LinkedText
              text={caption}
              className={`shrink text-[16px] leading-[21px] ${fg}`}
              linkClassName={fg}
            />
            {meta}
          </View>
        ) : (
          <View className="absolute bottom-2.5 right-2.5 rounded-full bg-black/45 px-2 py-0.5">
            <Meta message={message} isMine onImage receipt={receipt} />
          </View>
        )}
      </View>
    );
  }

  if (message.type === 'sticker' && attachment) {
    return (
      <View className="items-end gap-1">
        <Image source={{ uri: attachment.url }} className="size-36" contentFit="contain" />
        <View className="rounded-full bg-black/45 px-2 py-0.5">
          <Meta message={message} isMine onImage receipt={receipt} />
        </View>
      </View>
    );
  }

  if (message.type === 'voice' && attachment) {
    return (
      <View className="gap-0.5">
        {message.status ? (
          <View className="w-56 flex-row items-center gap-2.5 py-1.5">
            <ActivityIndicator color={iconColor} />
            <Text className={`text-sm ${isMine ? 'text-on-primary/80' : 'text-muted'}`}>
              Sending voice message…
            </Text>
          </View>
        ) : (
          <VoicePlayer
            url={attachment.url}
            durationMs={attachment.durationMs}
            color={iconColor}
            trackClassName={isMine ? 'bg-on-primary/30' : 'bg-primary/15'}
            fillClassName={isMine ? 'bg-on-primary' : 'bg-primary'}
            textClassName={isMine ? 'text-on-primary/80' : 'text-muted'}
          />
        )}
        <View className="self-end">{meta}</View>
      </View>
    );
  }

  if (message.type === 'file' && attachment) {
    return (
      <View className="gap-1.5">
        <FileContent message={message} attachment={attachment} isMine={isMine} />
        <View className="flex-row flex-wrap items-end">
          {caption ? (
            <LinkedText text={caption} className={`shrink text-[16px] leading-[21px] ${fg}`} linkClassName={fg} />
          ) : null}
          {meta}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap items-end">
      <LinkedText
        text={message.text}
        selectable={false}
        className={`shrink text-[16px] leading-[21px] ${fg}`}
        linkClassName={fg}
      />
      {meta}
    </View>
  );
}

/** Time, "edited" and the delivery ticks in the bubble's corner. */
function Meta({
  message,
  isMine,
  receipt,
  onImage,
}: {
  message: UiMessage;
  isMine: boolean;
  receipt: Receipt;
  /** Drawn over a photo or sticker, on a dark pill. */
  onImage?: boolean;
}) {
  const ctx = use(MessageRowContext)!;
  const color = onImage ? '#ffffff' : isMine ? ctx.colors.onPrimary : ctx.colors.muted;
  const textClass = onImage ? 'text-white' : isMine ? 'text-on-primary/75' : 'text-muted';
  const showReceipt = message.senderPhone === ctx.myPhone && receipt !== 'none' && receipt !== 'failed';
  const tick: IconName =
    receipt === 'pending'
      ? { ios: 'clock', android: 'schedule' }
      : { ios: 'checkmark', android: 'check' };

  return (
    <View className={`flex-row items-center gap-1 self-end ${onImage ? '' : 'ml-auto mt-0.5 pl-2'}`}>
      {message.editedAt && !message.deleted ? (
        <Text className={`text-[11px] italic ${textClass}`}>edited</Text>
      ) : null}
      <Text className={`text-[11px] ${textClass}`} style={{ fontVariant: ['tabular-nums'] }}>
        {formatTime(parseDate(message.createdAt))}
      </Text>
      {showReceipt ? (
        receipt === 'read' ? (
          <View
            className="flex-row"
            accessible
            accessibilityLabel="Read">
            <Icon name={{ ios: 'checkmark', android: 'done_all' }} size={11} color={READ_TICK} weight="bold" />
            {process.env.EXPO_OS === 'ios' ? (
              <Icon
                name={{ ios: 'checkmark', android: 'done_all' }}
                size={11}
                color={READ_TICK}
                weight="bold"
                style={{ marginLeft: -6 }}
              />
            ) : null}
          </View>
        ) : (
          <View accessible accessibilityLabel={receipt === 'pending' ? 'Sending' : 'Sent'}>
            <Icon name={tick} size={11} color={color} weight="bold" />
          </View>
        )
      ) : null}
    </View>
  );
}

function ReplyQuote({
  reply,
  isMine,
  myPhone,
  padded,
  onPress,
}: {
  reply: ChatReply;
  isMine: boolean;
  myPhone: string;
  padded: boolean;
  onPress: () => void;
}) {
  const name = reply.senderPhone === myPhone ? 'You' : reply.senderName || reply.senderPhone || '';
  const accent = isMine ? undefined : colorFor(reply.senderPhone ?? '');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reply to ${name}. Show original message`}
      className={`mb-1.5 flex-row overflow-hidden rounded-lg active:opacity-70 ${isMine ? 'bg-on-primary/15' : 'bg-background'} ${padded ? 'mx-0 mt-0' : ''}`}>
      <View className={isMine ? 'w-1 bg-on-primary' : 'w-1'} style={accent ? { backgroundColor: accent } : undefined} />
      <View className="shrink gap-0.5 px-2 py-1.5">
        <Text
          className={`text-[13px] font-semibold ${isMine ? 'text-on-primary' : ''}`}
          style={accent ? { color: accent } : undefined}
          numberOfLines={1}>
          {name}
        </Text>
        <Text
          className={`text-[13px] ${isMine ? 'text-on-primary/80' : 'text-muted'}`}
          numberOfLines={2}>
          {reply.text}
        </Text>
      </View>
    </Pressable>
  );
}

function ImageContent({ message, attachment }: { message: UiMessage; attachment: ChatAttachment }) {
  const ctx = use(MessageRowContext)!;
  const { width, height } = attachment;
  const aspect = width && height ? Math.min(1.8, Math.max(0.6, width / height)) : 4 / 3;
  const uploading = message.status === 'pending' && !message.outgoing?.attachment;

  return (
    <Pressable
      onPress={() => ctx.onOpenImage(message)}
      accessibilityRole="imagebutton"
      accessibilityLabel={captionOf(message) || 'Photo'}>
      <Image
        source={{ uri: attachment.url }}
        placeholder={message.previewUri ? { uri: message.previewUri } : undefined}
        placeholderContentFit="cover"
        className="rounded-[14px] bg-background"
        style={{ width: 240, aspectRatio: aspect }}
        contentFit="cover"
        transition={message.previewUri ? 0 : 150}
        recyclingKey={message.key}
      />
      {uploading ? (
        <View className="absolute inset-0 items-center justify-center rounded-[14px] bg-black/25">
          <ActivityIndicator color="#ffffff" />
        </View>
      ) : null}
    </Pressable>
  );
}

function fileIcon(name = ''): IconName {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return { ios: 'doc.richtext.fill', android: 'picture_as_pdf' };
  if (/\.(docx?|txt|rtf)$/.test(n)) return { ios: 'doc.text.fill', android: 'description' };
  if (/\.(xlsx?|csv)$/.test(n)) return { ios: 'tablecells.fill', android: 'table_chart' };
  if (/\.(pptx?|key)$/.test(n)) return { ios: 'rectangle.fill.on.rectangle.angled.fill', android: 'slideshow' };
  if (/\.(zip|rar|7z)$/.test(n)) return { ios: 'doc.zipper', android: 'folder_zip' };
  return { ios: 'doc.fill', android: 'draft' };
}

function FileContent({
  message,
  attachment,
  isMine,
}: {
  message: UiMessage;
  attachment: ChatAttachment;
  isMine: boolean;
}) {
  const ctx = use(MessageRowContext)!;
  const sending = message.status === 'pending';
  const fg = isMine ? 'text-on-primary' : 'text-foreground';
  return (
    <Pressable
      disabled={!!message.status}
      onPress={() => void WebBrowser.openBrowserAsync(attachment.url)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${attachment.name ?? 'document'}`}
      className={`w-60 flex-row items-center gap-2.5 rounded-xl p-2.5 active:opacity-70 ${isMine ? 'bg-on-primary/15' : 'bg-background'}`}
      style={{ borderCurve: 'continuous' }}>
      <Icon name={fileIcon(attachment.name)} size={30} color={isMine ? ctx.colors.onPrimary : ctx.colors.accent} />
      <View className="flex-1 gap-0.5">
        <Text className={`text-[15px] font-semibold ${fg}`} numberOfLines={2}>
          {attachment.name ?? 'Document'}
        </Text>
        <Text className={`text-xs ${isMine ? 'text-on-primary/75' : 'text-muted'}`}>
          {sending ? 'Uploading…' : message.status === 'failed' ? 'Not sent' : fileSize(attachment.size)}
        </Text>
      </View>
      {sending ? <ActivityIndicator color={isMine ? ctx.colors.onPrimary : ctx.colors.accent} /> : null}
    </Pressable>
  );
}

function ReactionsChip({ reactions, onPress }: { reactions: ChatReaction[]; onPress: () => void }) {
  const emojis = [...new Set(reactions.map((r) => r.emoji))].slice(0, 3);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${reactions.length} reactions`}
      className="-mt-2 mx-2 flex-row items-center gap-0.5 rounded-full border border-border bg-surface px-1.5 py-0.5 active:opacity-70"
      style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)' }}>
      <Text className="text-[13px]">{emojis.join('')}</Text>
      {reactions.length > 1 ? (
        <Text className="text-xs text-muted" style={{ fontVariant: ['tabular-nums'] }}>
          {reactions.length}
        </Text>
      ) : null}
    </Pressable>
  );
}
