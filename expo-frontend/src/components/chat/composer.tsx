import { useAudioRecorder } from 'expo-audio';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cubicBezier,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import type { PendingUpload, UiMessage } from '@/lib/chat/chat-room';
import { fileSize, formatDuration } from '@/lib/chat/format';
import { VOICE_OPTIONS, VoiceRecording, type RecordState } from '@/lib/chat/voice-recording';

export type StagedAttachment = PendingUpload & { kind: 'image' | 'file' };

export type ComposerHandle = {
  focus: () => void;
  setText: (text: string) => void;
};

/** Dragging the mic this far left cancels the recording. */
const CANCEL_DISTANCE = 110;
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/**
 * Message input bar: a growing text field, an attachment button, and a send
 * button that swaps in for the mic once there's text. Hold the mic to record
 * a voice message, release to send, slide left to cancel. A reply or edit
 * banner sits above it.
 */
export function Composer({
  ref,
  myPhone,
  replyingTo,
  editing,
  staged,
  onRemoveStaged,
  onCancelBanner,
  onSendText,
  onAttach,
  onTextChange,
  onVoice,
}: {
  ref?: Ref<ComposerHandle>;
  myPhone: string;
  replyingTo: UiMessage | null;
  editing: UiMessage | null;
  /** A photo or file waiting to be sent; the text becomes its caption. */
  staged: StagedAttachment | null;
  onRemoveStaged: () => void;
  onCancelBanner: () => void;
  onSendText: (text: string) => void;
  onAttach: () => void;
  onTextChange: (hasText: boolean) => void;
  onVoice: (file: PendingUpload) => void;
}) {
  const insets = useSafeAreaInsets();
  const [muted, accent] = useCSSVariable(['--color-muted', '--color-accent']) as string[];
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    setText: (value: string) => {
      setText(value);
      onTextChange(value.trim().length > 0);
    },
  }));

  const hasText = text.trim().length > 0;
  const showSend = hasText || !!editing || !!staged;

  const changeText = (value: string) => {
    setText(value);
    onTextChange(value.trim().length > 0);
  };

  const send = () => {
    if (!hasText && !editing && !staged) return;
    onSendText(text);
    setText('');
    onTextChange(false);
  };

  // ------------------------------------------------------------- voice

  const recorder = useAudioRecorder(VOICE_OPTIONS);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [voice] = useState(
    () =>
      new VoiceRecording(recorder, (state, at) => {
        setRecordState(state);
        setStartedAt(at);
      }),
  );
  useEffect(() => voice.setOnVoice(onVoice), [voice, onVoice]);
  // Stop a recording in progress if the screen goes away.
  useEffect(() => () => voice.dispose(), [voice]);

  const dragX = useSharedValue(0);
  const cancelled = useSharedValue(false);

  // Plain functions: worklets can call back into JS through these, but
  // can't capture the recorder object itself.
  const beginVoice = () => void voice.begin();
  const finishVoice = () => void voice.finish();
  const cancelVoice = () => void voice.cancel();
  const voiceHint = () => voice.hint();

  const mic = Gesture.Pan()
    // pointerEvents doesn't stop gesture-handler; the send button sits on top.
    .enabled(!showSend)
    .activateAfterLongPress(120)
    .onStart(() => {
      cancelled.set(false);
      scheduleOnRN(beginVoice);
    })
    .onUpdate((e) => {
      const x = Math.min(0, e.translationX);
      dragX.set(x);
      if (x < -CANCEL_DISTANCE && !cancelled.get()) {
        cancelled.set(true);
        scheduleOnRN(cancelVoice);
      }
    })
    .onEnd(() => {
      if (!cancelled.get()) scheduleOnRN(finishVoice);
    })
    .onFinalize((_, success) => {
      dragX.set(withSpring(0, { duration: 300, dampingRatio: 0.8 }));
      if (!success) scheduleOnRN(voiceHint);
    });

  const slideStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragX.get(), [-CANCEL_DISTANCE, 0], [0.15, 1], Extrapolation.CLAMP),
    transform: [{ translateX: dragX.get() * 0.5 }],
  }));
  const micStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.get() * 0.35 }] }));

  const recording = recordState !== 'idle';
  const banner = editing ?? replyingTo;

  return (
    <View
      className="border-t border-border bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      {banner ? (
        <View className="flex-row items-center gap-2.5 px-3 pt-2">
          <View className="w-1 self-stretch rounded-full bg-primary" />
          <Icon
            name={
              editing
                ? { ios: 'pencil', android: 'edit' }
                : { ios: 'arrowshape.turn.up.left.fill', android: 'reply' }
            }
            size={16}
            color={accent}
          />
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-accent" numberOfLines={1}>
              {editing
                ? 'Edit message'
                : banner.senderPhone === myPhone
                  ? 'Replying to yourself'
                  : `Replying to ${banner.senderName || banner.senderPhone}`}
            </Text>
            <Text className="text-[13px] text-muted" numberOfLines={1}>
              {banner.text}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              onCancelBanner();
              if (editing) changeText('');
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Cancel editing' : 'Cancel reply'}
            className="size-7 items-center justify-center rounded-full bg-surface active:opacity-60">
            <Icon name={{ ios: 'xmark', android: 'close' }} size={12} color={muted} weight="bold" />
          </Pressable>
        </View>
      ) : null}

      {staged ? (
        <View className="flex-row px-3 pt-2.5">
          <View>
            {staged.kind === 'image' ? (
              <Image
                source={{ uri: staged.uri }}
                className="size-20 rounded-xl bg-surface"
                contentFit="cover"
                accessibilityLabel="Photo to send"
              />
            ) : (
              <View className="h-14 max-w-64 flex-row items-center gap-2 rounded-xl border border-border bg-surface px-3">
                <Icon name={{ ios: 'doc.fill', android: 'description' }} size={20} color={accent} />
                <View className="shrink">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {staged.name}
                  </Text>
                  <Text className="text-xs text-muted">{fileSize(staged.size)}</Text>
                </View>
              </View>
            )}
            <Pressable
              onPress={onRemoveStaged}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Remove attachment"
              className="absolute -right-2 -top-2 size-6 items-center justify-center rounded-full border-2 border-background bg-muted active:opacity-70">
              <Icon name={{ ios: 'xmark', android: 'close' }} size={10} color="#ffffff" weight="bold" />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View className="flex-row items-end gap-2 px-2 pt-2">
        {recording ? (
          <View className="h-10 flex-1 flex-row items-center gap-2 px-2">
            <Animated.View
              className="size-2.5 rounded-full bg-danger"
              style={{
                animationName: { from: { opacity: 1 }, to: { opacity: 0.2 } },
                animationDuration: '700ms',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
              }}
            />
            {recordState === 'recording' ? (
              <RecordingTimer startedAt={startedAt} />
            ) : (
              <Text className="text-base text-muted">0:00</Text>
            )}
            <Animated.View style={slideStyle} className="flex-1 flex-row items-center justify-center gap-1">
              <Icon name={{ ios: 'chevron.left', android: 'chevron_left' }} size={14} color={muted} />
              <Text className="text-[15px] text-muted">Slide to cancel</Text>
            </Animated.View>
          </View>
        ) : (
          <>
            {editing || staged ? null : (
              <Pressable
                onPress={onAttach}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Attach"
                className="size-10 items-center justify-center rounded-full active:opacity-60">
                <Icon name={{ ios: 'plus', android: 'add' }} size={22} color={accent} weight="semibold" />
              </Pressable>
            )}
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={changeText}
              placeholder={staged ? 'Add a caption' : 'Message'}
              placeholderTextColor={muted}
              multiline
              autoCapitalize="sentences"
              textAlignVertical="center"
              accessibilityLabel="Message"
              className="max-h-36 min-h-10 flex-1 rounded-[20px] border border-border bg-surface px-4 text-[16px] text-foreground"
              style={{
                borderCurve: 'continuous',
                paddingTop: process.env.EXPO_OS === 'ios' ? 10 : 8,
                paddingBottom: process.env.EXPO_OS === 'ios' ? 10 : 8,
              }}
            />
          </>
        )}

        <View className="size-10 items-center justify-center">
          {/* The mic stays mounted while recording: it owns the gesture. */}
          <GestureDetector gesture={mic}>
            <Animated.View
              accessible
              accessibilityRole="button"
              accessibilityLabel="Hold to record a voice message"
              pointerEvents={showSend ? 'none' : 'auto'}
              className="absolute"
              style={micStyle}>
              <Animated.View
                className={`size-10 items-center justify-center rounded-full ${recording ? 'bg-danger' : ''}`}
                style={{
                  opacity: showSend ? 0 : 1,
                  transform: [{ scale: showSend ? 0.6 : recording ? 1.25 : 1 }],
                  transitionProperty: ['opacity', 'transform'],
                  transitionDuration: 150,
                  transitionTimingFunction: EASE_OUT,
                }}>
                <Icon
                  name={{ ios: 'mic.fill', android: 'mic' }}
                  size={recording ? 20 : 22}
                  color={recording ? '#ffffff' : accent}
                />
              </Animated.View>
            </Animated.View>
          </GestureDetector>
          <Animated.View
            pointerEvents={showSend ? 'auto' : 'none'}
            className="absolute"
            style={{
              opacity: showSend ? 1 : 0,
              transform: [{ scale: showSend ? 1 : 0.6 }],
              transitionProperty: ['opacity', 'transform'],
              transitionDuration: 150,
              transitionTimingFunction: EASE_OUT,
            }}>
            <Pressable
              onPress={send}
              accessibilityRole="button"
              accessibilityLabel={editing ? 'Save changes' : 'Send'}
              className="size-9 items-center justify-center rounded-full bg-primary active:opacity-70">
              <Icon
                name={
                  editing
                    ? { ios: 'checkmark', android: 'check' }
                    : { ios: 'arrow.up', android: 'send' }
                }
                size={17}
                color="#ffffff"
                weight="bold"
              />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

/** Its own component so only the timer re-renders while recording. */
function RecordingTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return (
    <Text className="text-base text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
      {formatDuration(now - startedAt)}
    </Text>
  );
}
