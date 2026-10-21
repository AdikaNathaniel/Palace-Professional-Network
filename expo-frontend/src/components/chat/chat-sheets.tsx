/**
 * The chat screen's native sheets, built with @expo/ui (SwiftUI on iOS,
 * Jetpack Compose on Android). Each is driven by `isPresented` from the
 * screen, which keeps one sheet open at a time.
 *
 * Row icons and the emoji row are React Native views: @expo/ui's ListItem
 * hosts RN accessories itself, and its own Icon needs Material Symbol assets
 * on Android that this app doesn't ship.
 */
import {
  BottomSheet,
  Button,
  Column,
  FieldGroup,
  ListItem,
  RNHostView,
  Row,
  Spacer,
  Switch,
  Text,
  TextInput,
} from '@expo/ui';
import { useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { linkButtonModifiers, sheetModifiers } from '@/components/chat/sheet-modifiers';
import { Icon, type IconName } from '@/components/ui/icon';
import type { ChatPoll, ChatReaction } from '@/lib/api/types';
import { captionOf, type UiMessage } from '@/lib/chat/chat-room';

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const MAX_POLL_OPTIONS = 12;

function useSheetColors() {
  const [surface, foreground, muted, danger, primary] = useCSSVariable([
    '--color-surface',
    '--color-foreground',
    '--color-muted',
    '--color-danger',
    '--color-primary',
  ]) as string[];
  return { surface: surface!, foreground: foreground!, muted: muted!, danger: danger!, primary: primary! };
}

function RowIcon({ name, color, filled }: { name: IconName; color: string; filled?: boolean }) {
  return filled ? (
    <View className="size-9 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
      <Icon name={name} size={18} color="#ffffff" />
    </View>
  ) : (
    <View className="size-7 items-center justify-center">
      <Icon name={name} size={20} color={color} />
    </View>
  );
}

function SheetTitle({ children, color, inset }: { children: string; color: string; inset?: boolean }) {
  return (
    <Text
      textStyle={{ fontSize: 17, fontWeight: '600', color }}
      style={{ paddingBottom: 8, paddingHorizontal: inset ? 16 : 0 }}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------- attach

export type AttachmentChoice = 'camera' | 'library' | 'document' | 'sticker' | 'poll';

const ATTACHMENTS: { choice: AttachmentChoice; label: string; icon: IconName; color: string }[] = [
  { choice: 'camera', label: 'Camera', icon: { ios: 'camera.fill', android: 'photo_camera' }, color: '#db2777' },
  { choice: 'library', label: 'Photo Library', icon: { ios: 'photo.on.rectangle', android: 'photo_library' }, color: '#2563eb' },
  { choice: 'document', label: 'Document', icon: { ios: 'doc.fill', android: 'description' }, color: '#6366f1' },
  { choice: 'sticker', label: 'Sticker or GIF', icon: { ios: 'face.smiling.inverse', android: 'mood' }, color: '#0891b2' },
  { choice: 'poll', label: 'Poll', icon: { ios: 'chart.bar.fill', android: 'bar_chart' }, color: '#16a34a' },
];

export function AttachmentSheet({
  isPresented,
  onDismiss,
  onSelect,
}: {
  isPresented: boolean;
  onDismiss: () => void;
  onSelect: (choice: AttachmentChoice) => void;
}) {
  const colors = useSheetColors();
  return (
    <BottomSheet isPresented={isPresented} onDismiss={onDismiss} containerColor={colors.surface}
      modifiers={sheetModifiers(colors.primary)}>
      <Column spacing={14} style={{ paddingTop: 8, paddingBottom: 24 }}>
        {ATTACHMENTS.map(({ choice, label, icon, color }) => (
          <ListItem
            key={choice}
            onPress={() => onSelect(choice)}
            leading={<RowIcon name={icon} color={color} filled />}>
            <Text textStyle={{ fontSize: 17, color: colors.foreground }}>{label}</Text>
          </ListItem>
        ))}
      </Column>
    </BottomSheet>
  );
}

// -------------------------------------------------------- message actions

export type MessageAction = 'reply' | 'copy' | 'edit' | 'delete' | 'votes' | 'retry' | 'discard';

export function MessageActionsSheet({
  message,
  myReaction,
  canEdit,
  canDelete,
  onDismiss,
  onReact,
  onMoreReactions,
  onAction,
}: {
  message: UiMessage | null;
  myReaction: string | null;
  canEdit: boolean;
  canDelete: boolean;
  onDismiss: () => void;
  onReact: (emoji: string) => void;
  onMoreReactions: () => void;
  onAction: (action: MessageAction) => void;
}) {
  const colors = useSheetColors();
  const failed = message?.status === 'failed';
  const actions: { action: MessageAction; label: string; icon: IconName; destructive?: boolean }[] = [];
  if (message) {
    if (failed) {
      actions.push({ action: 'retry', label: 'Try Again', icon: { ios: 'arrow.clockwise', android: 'refresh' } });
    } else {
      actions.push({ action: 'reply', label: 'Reply', icon: { ios: 'arrowshape.turn.up.left', android: 'reply' } });
    }
    if (message.type === 'text' ? !!message.text : !!captionOf(message)) {
      actions.push({ action: 'copy', label: 'Copy', icon: { ios: 'doc.on.doc', android: 'content_copy' } });
    }
    if (message.type === 'poll' && !failed) {
      actions.push({ action: 'votes', label: 'View Votes', icon: { ios: 'list.bullet.rectangle', android: 'how_to_vote' } });
    }
    if (canEdit) actions.push({ action: 'edit', label: 'Edit', icon: { ios: 'pencil', android: 'edit' } });
    if (failed) {
      actions.push({ action: 'discard', label: 'Delete', icon: { ios: 'trash', android: 'delete' }, destructive: true });
    } else if (canDelete) {
      actions.push({ action: 'delete', label: 'Delete for Everyone', icon: { ios: 'trash', android: 'delete' }, destructive: true });
    }
  }

  return (
    <BottomSheet isPresented={!!message} onDismiss={onDismiss} containerColor={colors.surface}
      modifiers={sheetModifiers(colors.primary)}>
      <Column spacing={12} style={{ paddingBottom: 24 }}>
        {message && !failed ? (
          <RNHostView matchContents>
            <View className="flex-row items-center justify-between pr-1">
              {QUICK_REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => onReact(emoji)}
                  accessibilityRole="button"
                  accessibilityLabel={myReaction === emoji ? `Remove ${emoji} reaction` : `React with ${emoji}`}
                  accessibilityState={{ selected: myReaction === emoji }}
                  className={`size-12 items-center justify-center rounded-full active:opacity-60 ${myReaction === emoji ? 'bg-primary/20' : 'bg-background'}`}>
                  <RNText className="text-[26px]">{emoji}</RNText>
                </Pressable>
              ))}
              <Pressable
                onPress={onMoreReactions}
                accessibilityRole="button"
                accessibilityLabel="More reactions"
                className="size-12 items-center justify-center rounded-full bg-background active:opacity-60">
                <Icon name={{ ios: 'face.smiling', android: 'add_reaction' }} size={24} color={colors.muted} />
              </Pressable>
            </View>
          </RNHostView>
        ) : null}
        {message?.text ? (
          <Text numberOfLines={3} textStyle={{ fontSize: 14, color: colors.muted }}>
            {message.text}
          </Text>
        ) : null}
        <Column spacing={14}>
          {actions.map(({ action, label, icon, destructive }) => (
            <ListItem
              key={action}
              onPress={() => onAction(action)}
              leading={<RowIcon name={icon} color={destructive ? colors.danger : colors.foreground} />}>
              <Text textStyle={{ fontSize: 17, color: destructive ? colors.danger : colors.foreground }}>
                {label}
              </Text>
            </ListItem>
          ))}
        </Column>
      </Column>
    </BottomSheet>
  );
}

// ------------------------------------------------------- who reacted

export function ReactionsSheet({
  reactions,
  myPhone,
  onDismiss,
  onRemoveMine,
}: {
  reactions: ChatReaction[] | null;
  myPhone: string;
  onDismiss: () => void;
  onRemoveMine: () => void;
}) {
  const colors = useSheetColors();
  const count = reactions?.length ?? 0;
  return (
    <BottomSheet isPresented={!!reactions} onDismiss={onDismiss} containerColor={colors.surface}
      modifiers={sheetModifiers(colors.primary)}>
      <Column spacing={12} style={{ paddingBottom: 24 }}>
        <SheetTitle color={colors.foreground}>{`${count} ${count === 1 ? 'Reaction' : 'Reactions'}`}</SheetTitle>
        {(reactions ?? []).map((r) => {
          const mine = r.phone === myPhone;
          return (
            <ListItem
              key={r.phone}
              onPress={mine ? onRemoveMine : undefined}
              supportingText={mine ? 'Tap to remove' : undefined}
              leading={<RNText className="text-[26px]">{r.emoji}</RNText>}>
              <Text textStyle={{ fontSize: 17, color: colors.foreground }}>
                {mine ? 'You' : r.name || r.phone}
              </Text>
            </ListItem>
          );
        })}
      </Column>
    </BottomSheet>
  );
}

// ------------------------------------------------------------- votes

export function PollVotesSheet({
  poll,
  nameFor,
  onDismiss,
}: {
  poll: ChatPoll | null;
  nameFor: (phone: string) => string;
  onDismiss: () => void;
}) {
  const colors = useSheetColors();
  return (
    <BottomSheet
      isPresented={!!poll}
      onDismiss={onDismiss}
      snapPoints={['half', 'full']}
      contentPadding={{ top: 16, left: 0, right: 0 }}
      containerColor={colors.surface}
      modifiers={sheetModifiers(colors.primary)}>
      {poll ? (
        <Column spacing={8}>
          <SheetTitle color={colors.foreground} inset>
            {poll.question}
          </SheetTitle>
          <FieldGroup>
            {poll.options.map((option) => (
              <FieldGroup.Section
                key={option.id}
                title={`${option.text} · ${option.voters.length} ${option.voters.length === 1 ? 'vote' : 'votes'}`}>
                {option.voters.length ? (
                  option.voters.map((phone) => <Text key={phone}>{nameFor(phone)}</Text>)
                ) : (
                  <Text textStyle={{ color: colors.muted }}>No votes</Text>
                )}
              </FieldGroup.Section>
            ))}
          </FieldGroup>
        </Column>
      ) : null}
    </BottomSheet>
  );
}

// ----------------------------------------------------------- new poll

export type NewPoll = { question: string; options: string[]; allowMultiple: boolean };

let optionSeq = 0;
const newOption = () => ({ id: `option-${optionSeq++}`, text: '' });

export function CreatePollSheet({
  isPresented,
  onDismiss,
  onSubmit,
}: {
  isPresented: boolean;
  onDismiss: () => void;
  onSubmit: (poll: NewPoll) => void;
}) {
  const colors = useSheetColors();
  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={['full']}
      contentPadding={{ top: 12, left: 0, right: 0 }}
      containerColor={colors.surface}
      modifiers={sheetModifiers(colors.primary)}>
      {/* Remounted per presentation, so each poll starts blank. */}
      {isPresented ? <CreatePollForm colors={colors} onCancel={onDismiss} onSubmit={onSubmit} /> : null}
    </BottomSheet>
  );
}

function CreatePollForm({
  colors,
  onCancel,
  onSubmit,
}: {
  colors: ReturnType<typeof useSheetColors>;
  onCancel: () => void;
  onSubmit: (poll: NewPoll) => void;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(() => [newOption(), newOption()]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const filled = options.map((o) => o.text.trim()).filter(Boolean);
  const valid = question.trim().length > 0 && filled.length >= 2;

  const setOptionText = (id: string, text: string) =>
    setOptions((list) => list.map((o) => (o.id === id ? { ...o, text } : o)));
  const removeOption = (id: string) => setOptions((list) => list.filter((o) => o.id !== id));

  const submit = () => {
    if (valid) onSubmit({ question: question.trim(), options: filled, allowMultiple });
  };

  return (
    <Column spacing={8}>
      <Row alignment="center" style={{ paddingHorizontal: 16 }}>
        <Button variant="text" modifiers={linkButtonModifiers()} label="Cancel" onPress={onCancel} />
        <Spacer />
        <Text textStyle={{ fontSize: 17, fontWeight: '600', color: colors.foreground }}>New Poll</Text>
        <Spacer />
        <Button variant="text" modifiers={linkButtonModifiers()} label="Send" onPress={submit} disabled={!valid} />
      </Row>
      <FieldGroup>
        <FieldGroup.Section title="Question">
          <TextInput
            placeholder="Ask a question"
            autoFocus
            autoCapitalize="sentences"
            maxLength={300}
            onChangeText={setQuestion}
          />
        </FieldGroup.Section>
        <FieldGroup.Section title="Options">
          {options.map((option, i) => (
            <Row key={option.id} alignment="center" spacing={8}>
              <TextInput
                placeholder={`Option ${i + 1}`}
                autoCapitalize="sentences"
                maxLength={100}
                onChangeText={(text) => setOptionText(option.id, text)}
              />
              {options.length > 2 ? (
                <RNHostView matchContents>
                  <Pressable
                    onPress={() => removeOption(option.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove option ${i + 1}`}
                    className="active:opacity-60">
                    <Icon name={{ ios: 'minus.circle.fill', android: 'remove_circle' }} size={22} color={colors.danger} />
                  </Pressable>
                </RNHostView>
              ) : null}
            </Row>
          ))}
          {options.length < MAX_POLL_OPTIONS ? (
            <Button
              variant="text"
              modifiers={linkButtonModifiers()}
              label="Add Option"
              onPress={() => setOptions((list) => [...list, newOption()])}
            />
          ) : null}
        </FieldGroup.Section>
        <FieldGroup.Section>
          <Switch label="Allow Multiple Answers" value={allowMultiple} onValueChange={setAllowMultiple} />
        </FieldGroup.Section>
      </FieldGroup>
    </Column>
  );
}
