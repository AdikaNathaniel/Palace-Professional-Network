import { AudioModule, RecordingPresets, setAudioModeAsync, type AudioRecorder, type RecordingOptions } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';

import type { PendingUpload } from '@/lib/chat/chat-room';

export const VOICE_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64_000,
};
const MIN_VOICE_MS = 1_000;

export type RecordState = 'idle' | 'starting' | 'recording';

function resetAudioMode() {
  void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
}

/**
 * Hold-to-record: `begin` on press, `finish` on release (sends), `cancel`
 * on slide-away. Starting is asynchronous (permission prompt, audio
 * session), so a release can arrive before recording has begun.
 */
export class VoiceRecording {
  private holding = false;
  private state: RecordState = 'idle';
  private startedAt = 0;
  private onVoice: (file: PendingUpload) => void = () => {};

  constructor(
    private readonly recorder: AudioRecorder,
    private readonly onStateChange: (state: RecordState, startedAt: number) => void,
  ) {}

  /** Where finished clips go (the latest handler from the screen). */
  setOnVoice(handler: (file: PendingUpload) => void) {
    this.onVoice = handler;
  }

  private set(state: RecordState) {
    this.state = state;
    this.onStateChange(state, this.startedAt);
  }

  begin = async () => {
    this.holding = true;
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      this.holding = false;
      toast.error('Microphone access is off', {
        description: 'Allow it in Settings to send voice messages.',
      });
      return;
    }
    // The first permission prompt takes the touch with it.
    if (!this.holding) return;
    this.set('starting');
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await this.recorder.prepareToRecordAsync();
      if (!this.holding) {
        this.set('idle');
        resetAudioMode();
        return;
      }
      this.recorder.record();
      this.startedAt = Date.now();
      this.set('recording');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      this.holding = false;
      this.set('idle');
      resetAudioMode();
      toast.error('Could not start recording. Please try again.');
    }
  };

  finish = async () => {
    this.holding = false;
    if (this.state !== 'recording') return;
    const durationMs = Date.now() - this.startedAt;
    this.set('idle');
    await this.stopRecorder();
    const uri = this.recorder.uri;
    if (durationMs < MIN_VOICE_MS || !uri) {
      toast('Hold to record, release to send.');
      return;
    }
    this.onVoice({ uri, name: 'voice.m4a', mimeType: 'audio/mp4', durationMs });
  };

  cancel = async () => {
    this.holding = false;
    if (this.state === 'idle') return;
    this.set('idle');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await this.stopRecorder();
  };

  /** A tap that never became a hold. */
  hint = () => {
    if (!this.holding) toast('Hold to record, release to send.');
  };

  /** The screen is going away mid-recording. */
  dispose() {
    if (this.state !== 'idle') void this.cancel();
  }

  private async stopRecorder() {
    try {
      await this.recorder.stop();
    } catch {
      // Already stopped.
    }
    resetAudioMode();
  }
}
