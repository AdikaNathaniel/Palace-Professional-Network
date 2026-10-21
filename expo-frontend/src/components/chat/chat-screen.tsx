import type { LegendListRef } from '@legendapp/list/react-native';
import { useKeyboardChatComposerInset } from '@legendapp/list/keyboard';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { KeyboardController, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmojiPicker from 'rn-emoji-keyboard';
import { toast } from 'sonner-native';
import { useCSSVariable } from 'uniwind';

import { ChatHeaderTitle, usePresence } from '@/components/chat/chat-header-title';
import {
  AttachmentSheet,
  CreatePollSheet,
  MessageActionsSheet,
  PollVotesSheet,
  ReactionsSheet,
  type AttachmentChoice,
  type MessageAction,
  type NewPoll,
} from '@/components/chat/chat-sheets';
import { Composer, type ComposerHandle, type StagedAttachment } from '@/components/chat/composer';
import { MessageList } from '@/components/chat/message-list';
import type { MessageRowContextValue } from '@/components/chat/message-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useDirectory, useDmRooms } from '@/hooks/queries';
import { useChatRoom, useRoomState } from '@/hooks/use-chat-room';
import { MAX_UPLOAD_BYTES } from '@/lib/api/endpoints';
import { captionOf, type UiMessage } from '@/lib/chat/chat-room';
import { categoryOfRoom, otherPhoneInDm, professionShortLabel } from '@/lib/chat/rooms';
import { onStickerPicked, type StickerPick } from '@/lib/chat/sticker-picks';
import { resolveMediaUrl } from '@/lib/config';
import { useSession } from '@/stores/session';

/** iOS needs a moment after a sheet closes before presenting anything else. */
const SHEET_DISMISS_MS = 450;

type Sheet =
  | { kind: 'attach' }
  | { kind: 'poll' }
  | { kind: 'actions'; key: string }
  | { kind: 'reactions'; key: string }
  | { kind: 'votes'; key: string };

const TOO_BIG = 'Files must be 15 MB or smaller.';

function haptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function ChatScreen({
  roomId,
  titleParam,
  imageParam,
}: {
  roomId: string;
  titleParam?: string;
  imageParam?: string;
}) {
  const myPhone = useSession((s) => s.session!.phoneNumber);
  const insets = useSafeAreaInsets();
  const [primary, onPrimary, accent, muted, danger, surface, background, foreground, border] =
    useCSSVariable([
      '--color-primary',
      '--color-on-primary',
      '--color-accent',
      '--color-muted',
      '--color-danger',
      '--color-surface',
      '--color-background',
      '--color-foreground',
      '--color-border',
    ]) as string[];

  const otherPhone = otherPhoneInDm(roomId, myPhone);
  const category = categoryOfRoom(roomId);
  const isGroup = !otherPhone;

  // Names, photos and the member count come from data the app already has.
  const { data: directory } = useDirectory();
  const { data: dmRooms } = useDmRooms();
  const { data: presence } = usePresence(otherPhone);
  const members = useMemo(() => {
    const map = new Map<string, { name: string; imageUrl?: string | null }>();
    for (const b of directory ?? []) map.set(b.phoneNumber, { name: b.fullName, imageUrl: b.imageUrl });
    return map;
  }, [directory]);
  const dmPreview = dmRooms?.find((r) => r.roomId === roomId);
  const title = otherPhone
    ? titleParam || dmPreview?.otherName || presence?.fullName || members.get(otherPhone)?.name || otherPhone
    : professionShortLabel(category ?? titleParam ?? 'Group');
  const peerImage = otherPhone
    ? presence?.imageUrl || dmPreview?.otherImageUrl || members.get(otherPhone)?.imageUrl || imageParam
    : null;
  const memberCount = category
    ? (directory ?? []).filter((b) => b.professionCategory === category).length
    : undefined;

  const controller = useChatRoom(roomId);
  const status = useRoomState(controller, (s) => s.status);
  const error = useRoomState(controller, (s) => s.error);

  const listRef = useRef<LegendListRef>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const composerViewRef = useRef<View>(null);
  const { contentInsetEndAdjustment, onComposerLayout } = useKeyboardChatComposerInset(
    listRef,
    composerViewRef,
  );
  // The composer pads itself for the home indicator; with the keyboard up
  // that padding tucks behind the keyboard instead.
  const keyboardOffset = Math.max(insets.bottom, 8) - 8;

  const [replyKey, setReplyKey] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedAttachment | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [emojiFor, setEmojiFor] = useState<string | null>(null);

  const replyingTo = useRoomState(controller, (s) =>
    replyKey ? (s.messages.find((m) => m.key === replyKey) ?? null) : null,
  );
  const editing = useRoomState(controller, (s) =>
    editKey ? (s.messages.find((m) => m.key === editKey) ?? null) : null,
  );
  const sheetMessage = useRoomState(controller, (s) =>
    sheet && 'key' in sheet ? (s.messages.find((m) => m.key === sheet.key) ?? null) : null,
  );

  const nameFor = useCallback(
    (phone: string) =>
      phone === myPhone ? 'You' : members.get(phone)?.name || controller.nameFor(phone),
    [members, controller, myPhone],
  );
  const avatarFor = useCallback((phone: string) => members.get(phone)?.imageUrl, [members]);

  /** Closes the open sheet, then runs `next` once it's off screen. */
  const afterSheet = (next: () => void) => {
    setSheet(null);
    setTimeout(next, SHEET_DISMISS_MS);
  };

  const openSheet = (next: Sheet) => {
    void KeyboardController.dismiss();
    setSheet(next);
  };

  const startReply = useCallback((key: string) => {
    setEditKey(null);
    setReplyKey(key);
    composerRef.current?.focus();
  }, []);

  const rowContext = useMemo<Omit<MessageRowContextValue, 'onJumpTo'>>(
    () => ({
      myPhone,
      colors: { primary: primary!, onPrimary: onPrimary!, accent: accent!, muted: muted!, danger: danger! },
      onLongPress: (key) => {
        void KeyboardController.dismiss();
        setSheet({ kind: 'actions', key });
      },
      onReply: (key) => {
        haptic();
        startReply(key);
      },
      onRetry: (key) => controller.retry(key),
      onVote: (key, optionIds) => {
        const message = controller.find(key);
        if (message) controller.vote(message, optionIds);
      },
      onShowReactions: (key) => setSheet({ kind: 'reactions', key }),
      onShowVotes: (key) => setSheet({ kind: 'votes', key }),
      onOpenImage: (message) => {
        const attachment = message.attachment;
        if (!attachment) return;
        void KeyboardController.dismiss();
        router.push({
          pathname: '/chat/photo',
          params: {
            uri: attachment.url,
            ...(message.previewUri ? { placeholder: message.previewUri } : {}),
            ...(attachment.width ? { width: String(attachment.width) } : {}),
            ...(attachment.height ? { height: String(attachment.height) } : {}),
          },
        });
      },
    }),
    [myPhone, primary, onPrimary, accent, muted, danger, controller, startReply],
  );

  // ----------------------------------------------------------- sending

  const scrollToEnd = () => {
    setTimeout(() => void listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const sendText = (text: string) => {
    if (editing) {
      controller.edit(editing, text);
      setEditKey(null);
      haptic();
      return;
    }
    if (staged) {
      const { kind, ...upload } = staged;
      controller.send({ type: kind, text }, { upload, replyTo: replyingTo });
      setStaged(null);
    } else if (text.trim()) {
      controller.send({ type: 'text', text }, { replyTo: replyingTo });
    } else {
      return;
    }
    setReplyKey(null);
    haptic();
    scrollToEnd();
  };

  const sendNow = (...args: Parameters<typeof controller.send>) => {
    controller.send(args[0], { ...args[1], replyTo: replyingTo });
    setReplyKey(null);
    haptic();
    scrollToEnd();
  };

  // The sheet route hands the sticker back; send it with the current reply target.
  const stickerHandler = useRef<(pick: StickerPick) => void>(() => {});
  useEffect(() => {
    stickerHandler.current = ({ sticker, isGif }) =>
      // GIFs go out as images so older app versions show them, like the Flutter app.
      sendNow({
        type: isGif ? 'image' : 'sticker',
        attachment: { url: sticker.url, width: sticker.width, height: sticker.height, mimeType: 'image/gif' },
      });
  });
  useEffect(() => onStickerPicked(roomId, (pick) => stickerHandler.current(pick)), [roomId]);

  const pickImage = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : { granted: true };
    if (!permission.granted) {
      toast.error('Camera access is off', { description: 'Allow it in Settings to take photos.' });
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.75 };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    if (asset.fileSize && asset.fileSize > MAX_UPLOAD_BYTES) {
      toast.error(TOO_BIG);
      return;
    }
    const name = asset.fileName?.includes('.') ? asset.fileName : `photo-${Date.now()}.jpg`;
    setStaged({
      kind: 'image',
      uri: asset.uri,
      name,
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize,
      width: asset.width,
      height: asset.height,
    });
    composerRef.current?.focus();
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    if (asset.size && asset.size > MAX_UPLOAD_BYTES) {
      toast.error(TOO_BIG);
      return;
    }
    setStaged({
      kind: 'file',
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      size: asset.size,
    });
  };

  const onAttachment = (choice: AttachmentChoice) => {
    afterSheet(() => {
      switch (choice) {
        case 'camera':
        case 'library':
          void pickImage(choice);
          break;
        case 'document':
          void pickDocument();
          break;
        case 'sticker':
          router.push({ pathname: '/chat/stickers', params: { roomId } });
          break;
        case 'poll':
          setSheet({ kind: 'poll' });
          break;
      }
    });
  };

  const sendPoll = (poll: NewPoll) => {
    setSheet(null);
    sendNow({ type: 'poll', poll });
  };

  // ---------------------------------------------------- message actions

  const react = (message: UiMessage, emoji: string) => {
    void Haptics.selectionAsync();
    controller.react(message, emoji);
  };

  const onAction = (action: MessageAction) => {
    const message = sheetMessage;
    if (!message) return;
    switch (action) {
      case 'reply':
        afterSheet(() => startReply(message.key));
        break;
      case 'copy':
        setSheet(null);
        void Clipboard.setStringAsync(message.type === 'text' ? message.text : captionOf(message)).then(() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.success('Copied');
        });
        break;
      case 'edit':
        afterSheet(() => {
          setReplyKey(null);
          setStaged(null);
          setEditKey(message.key);
          composerRef.current?.setText(message.text);
          composerRef.current?.focus();
        });
        break;
      case 'delete':
        afterSheet(() =>
          Alert.alert('Delete message?', 'This message will be deleted for everyone in this chat.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete for Everyone',
              style: 'destructive',
              onPress: () => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                controller.delete(message);
                if (replyKey === message.key) setReplyKey(null);
              },
            },
          ]),
        );
        break;
      case 'votes':
        afterSheet(() => setSheet({ kind: 'votes', key: message.key }));
        break;
      case 'retry':
        setSheet(null);
        controller.retry(message.key);
        break;
      case 'discard':
        setSheet(null);
        controller.discard(message.key);
        break;
    }
  };

  const openPeerPhoto = () => {
    const uri = resolveMediaUrl(peerImage);
    if (uri) router.push({ pathname: '/chat/photo', params: { uri } });
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title,
          headerTitle: () => (
            <ChatHeaderTitle
              controller={controller}
              title={title}
              imageUrl={peerImage}
              otherPhone={otherPhone}
              memberCount={memberCount}
              onPressAvatar={peerImage ? openPeerPhoto : undefined}
            />
          ),
          headerTitleAlign: 'left',
        }}
      />

      {status === 'ready' ? (
        <MessageList
          controller={controller}
          listRef={listRef}
          isGroup={isGroup}
          myPhone={myPhone}
          otherPhone={otherPhone}
          avatarFor={avatarFor}
          context={rowContext}
          composerHeight={contentInsetEndAdjustment}
          keyboardOffset={keyboardOffset}
        />
      ) : status === 'error' ? (
        <View className="flex-1 items-center justify-center gap-4 p-8">
          <Icon name={{ ios: 'wifi.exclamationmark', android: 'cloud_off' }} size={44} color={muted} />
          <Text selectable className="text-center text-base text-foreground">
            {error}
          </Text>
          <Button title="Try Again" variant="secondary" onPress={() => controller.retryConnection()} />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      <KeyboardStickyView
        offset={{ closed: 0, opened: keyboardOffset }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <View ref={composerViewRef} onLayout={onComposerLayout}>
          <Composer
            ref={composerRef}
            myPhone={myPhone}
            replyingTo={replyingTo}
            editing={editing}
            staged={staged}
            onRemoveStaged={() => setStaged(null)}
            onCancelBanner={() => {
              setReplyKey(null);
              setEditKey(null);
            }}
            onSendText={sendText}
            onAttach={() => openSheet({ kind: 'attach' })}
            onTextChange={(hasText) => {
              if (!editing) controller.onComposerChanged(hasText);
            }}
            onVoice={(upload) => sendNow({ type: 'voice' }, { upload })}
          />
        </View>
      </KeyboardStickyView>

      <AttachmentSheet
        isPresented={sheet?.kind === 'attach'}
        onDismiss={() => setSheet(null)}
        onSelect={onAttachment}
      />
      <CreatePollSheet
        isPresented={sheet?.kind === 'poll'}
        onDismiss={() => setSheet(null)}
        onSubmit={sendPoll}
      />
      <MessageActionsSheet
        message={sheet?.kind === 'actions' ? sheetMessage : null}
        myReaction={sheetMessage ? controller.myReaction(sheetMessage) : null}
        canEdit={!!sheetMessage && controller.canEdit(sheetMessage)}
        canDelete={!!sheetMessage && sheetMessage.senderPhone === myPhone}
        onDismiss={() => setSheet(null)}
        onReact={(emoji) => {
          if (sheetMessage) react(sheetMessage, emoji);
          setSheet(null);
        }}
        onMoreReactions={() => {
          const key = sheetMessage?.key ?? null;
          afterSheet(() => setEmojiFor(key));
        }}
        onAction={onAction}
      />
      <ReactionsSheet
        reactions={sheet?.kind === 'reactions' ? (sheetMessage?.reactions ?? null) : null}
        myPhone={myPhone}
        onDismiss={() => setSheet(null)}
        onRemoveMine={() => {
          if (sheetMessage) controller.react(sheetMessage, null);
          setSheet(null);
        }}
      />
      <PollVotesSheet
        poll={sheet?.kind === 'votes' ? (sheetMessage?.poll ?? null) : null}
        nameFor={nameFor}
        onDismiss={() => setSheet(null)}
      />

      <EmojiPicker
        open={!!emojiFor}
        onClose={() => setEmojiFor(null)}
        onEmojiSelected={(emoji) => {
          const message = emojiFor ? controller.find(emojiFor) : undefined;
          if (message) react(message, emoji.emoji);
        }}
        enableSearchBar
        enableRecentlyUsed
        categoryPosition="top"
        theme={{
          backdrop: '#00000055',
          knob: border,
          container: surface,
          header: muted,
          skinTonesContainer: background,
          category: { icon: muted, iconActive: onPrimary, container: background, containerActive: primary },
          search: { background, text: foreground, placeholder: muted, icon: muted },
          emoji: { selected: background },
        }}
      />
    </View>
  );
}
