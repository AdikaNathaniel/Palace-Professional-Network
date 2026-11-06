import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { toast } from 'sonner-native';

import { Icon } from '@/components/ui/icon';
import { formatDuration } from '@/lib/chat/format';

/** Only one voice message plays at a time, like every messaging app. */
let playing: AudioPlayer | null = null;

/**
 * Play/pause and progress for a voice message. The audio is only loaded
 * the first time it's played, so a long chat doesn't download every clip.
 */
export function VoicePlayer({
  url,
  durationMs,
  color,
  trackClassName,
  fillClassName,
  textClassName,
}: {
  url: string;
  durationMs?: number;
  /** Icon colour (hex). */
  color: string;
  trackClassName: string;
  fillClassName: string;
  textClassName: string;
}) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status.didJustFinish) {
      void player.seekTo(0);
      player.pause();
    }
  }, [status.didJustFinish, player]);

  useEffect(
    () => () => {
      if (playing === player) playing = null;
    },
    [player],
  );

  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    try {
      if (!loaded) {
        // Play through the speaker even with the silent switch on.
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
        player.replace({ uri: url });
        setLoaded(true);
      }
      if (playing && playing !== player) playing.pause();
      playing = player;
      player.play();
    } catch {
      toast.error('Could not play this voice message.');
    }
  };

  const total = status.duration > 0 ? status.duration * 1000 : (durationMs ?? 0);
  const position = status.currentTime * 1000;
  const progress = total > 0 ? Math.min(1, position / total) : 0;
  const started = status.playing || position > 0;
  const buffering = loaded && status.isBuffering && !status.isLoaded;

  return (
    <View className="w-56 flex-row items-center gap-2.5 py-0.5">
      <Pressable
        onPress={toggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause voice message' : 'Play voice message'}
        className="size-9 items-center justify-center active:opacity-60">
        {buffering ? (
          <ActivityIndicator color={color} />
        ) : (
          <Icon
            name={
              status.playing
                ? { ios: 'pause.circle.fill', android: 'pause_circle' }
                : { ios: 'play.circle.fill', android: 'play_circle' }
            }
            size={36}
            color={color}
          />
        )}
      </Pressable>
      <View className="flex-1 gap-1.5">
        <View className={`h-1 overflow-hidden rounded-full ${trackClassName}`}>
          <View
            className={`absolute inset-y-0 left-0 rounded-full ${fillClassName}`}
            style={{ width: `${progress * 100}%` }}
          />
        </View>
        <Text className={`text-xs ${textClassName}`} style={{ fontVariant: ['tabular-nums'] }}>
          {formatDuration(started ? position : total)}
        </Text>
      </View>
      <Icon name={{ ios: 'mic.fill', android: 'mic' }} size={16} color={color} />
    </View>
  );
}
