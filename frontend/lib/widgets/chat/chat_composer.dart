import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:audioplayers/audioplayers.dart';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import '../../models/chat_message.dart';
import '../../theme/app_theme.dart';
import '../../utils/chat_format.dart';

/// Message input bar: text field with an emoji panel, attachment button,
/// send button (or a mic button when empty - tap to record a voice note),
/// plus the "Replying to" / "Editing" banner above it and an upload
/// progress line.
class ChatComposer extends StatefulWidget {
  final TextEditingController controller;
  final String myPhone;
  final ChatMessage? replyingTo;
  final ChatMessage? editing;
  final String? busyLabel;
  final VoidCallback onCancelReply;
  final VoidCallback onCancelEdit;
  final VoidCallback onSend;
  final VoidCallback onAttach;
  final VoidCallback onTextChanged;
  final void Function(Uint8List bytes, Duration duration) onVoiceRecorded;

  const ChatComposer({
    super.key,
    required this.controller,
    required this.myPhone,
    required this.replyingTo,
    required this.editing,
    required this.busyLabel,
    required this.onCancelReply,
    required this.onCancelEdit,
    required this.onSend,
    required this.onAttach,
    required this.onTextChanged,
    required this.onVoiceRecorded,
  });

  @override
  State<ChatComposer> createState() => ChatComposerState();
}

enum _VoiceState { idle, starting, recording, recorded }

class ChatComposerState extends State<ChatComposer> {
  static const _minVoiceLength = Duration(seconds: 1);

  final _focus = FocusNode();
  final _recorder = AudioRecorder();
  final _preview = AudioPlayer();
  final _previewSubs = <StreamSubscription>[];
  bool _showEmoji = false;

  // Voice notes: tap the mic to start; while recording you can delete, stop
  // (to listen back first) or send straight away.
  _VoiceState _voice = _VoiceState.idle;
  String? _voicePath;
  DateTime? _recordStart;
  Duration _recordElapsed = Duration.zero;
  Timer? _recordTimer;
  bool _previewPlaying = false;
  Duration _previewPosition = Duration.zero;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onText);
    _focus.addListener(() {
      if (_focus.hasFocus && _showEmoji) setState(() => _showEmoji = false);
    });
    void update(VoidCallback fn) {
      if (mounted) setState(fn);
    }

    _previewSubs.addAll([
      _preview.onPlayerStateChanged.listen(
        (s) => update(() => _previewPlaying = s == PlayerState.playing),
      ),
      _preview.onPositionChanged.listen(
        (p) => update(() => _previewPosition = p),
      ),
      _preview.onPlayerComplete.listen(
        (_) => update(() => _previewPosition = Duration.zero),
      ),
    ]);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onText);
    _focus.dispose();
    _recordTimer?.cancel();
    for (final s in _previewSubs) {
      s.cancel();
    }
    _preview.dispose();
    if (_voice == _VoiceState.recording) _recorder.cancel();
    _recorder.dispose();
    _deleteVoiceFile();
    super.dispose();
  }

  void _onText() {
    setState(() {});
    widget.onTextChanged();
  }

  void focusInput() => _focus.requestFocus();

  /// Back button closes the emoji panel first, like WhatsApp.
  bool closeEmojiPanel() {
    if (!_showEmoji) return false;
    setState(() => _showEmoji = false);
    return true;
  }

  void _toggleEmoji() {
    if (_showEmoji) {
      setState(() => _showEmoji = false);
      _focus.requestFocus();
    } else {
      _focus.unfocus();
      setState(() => _showEmoji = true);
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  void _deleteVoiceFile() {
    final path = _voicePath;
    _voicePath = null;
    if (path != null) {
      File(path).delete().catchError((_) => File(path));
    }
  }

  Future<void> _startRecording() async {
    if (_voice != _VoiceState.idle) return;
    setState(() {
      _voice = _VoiceState.starting;
      _showEmoji = false;
    });
    _focus.unfocus();
    try {
      // The first time, this shows Android's permission prompt and waits
      // for the answer - recording only starts once it's allowed.
      if (!await _recorder.hasPermission()) {
        setState(() => _voice = _VoiceState.idle);
        _snack(
          'Microphone access is off. Allow it in Settings > Apps > '
          'Palace Professional Network > Permissions to send voice messages.',
        );
        return;
      }
      final dir = await getTemporaryDirectory();
      final path =
          '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 64000,
          sampleRate: 44100,
        ),
        path: path,
      );
      if (!mounted) return;
      setState(() {
        _voicePath = path;
        _voice = _VoiceState.recording;
        _recordStart = DateTime.now();
        _recordElapsed = Duration.zero;
      });
      _recordTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
        if (mounted && _recordStart != null) {
          setState(
            () => _recordElapsed = DateTime.now().difference(_recordStart!),
          );
        }
      });
    } catch (e) {
      if (mounted) setState(() => _voice = _VoiceState.idle);
      _snack('Could not start recording. Please try again.');
    }
  }

  /// Stops the recorder and keeps the clip for preview. Returns false if the
  /// clip was too short to keep.
  Future<bool> _finishRecording() async {
    _recordTimer?.cancel();
    final elapsed = _recordStart == null
        ? Duration.zero
        : DateTime.now().difference(_recordStart!);
    final path = await _recorder.stop() ?? _voicePath;
    _voicePath = path;
    _recordStart = null;
    if (elapsed < _minVoiceLength || path == null) {
      _deleteVoiceFile();
      if (mounted) setState(() => _voice = _VoiceState.idle);
      _snack('Recording too short. Tap the mic, speak, then tap send.');
      return false;
    }
    if (mounted) {
      setState(() {
        _recordElapsed = elapsed;
        _voice = _VoiceState.recorded;
        _previewPosition = Duration.zero;
      });
    }
    return true;
  }

  Future<void> _stopRecording() async {
    if (_voice != _VoiceState.recording) return;
    await _finishRecording();
  }

  Future<void> _togglePreview() async {
    final path = _voicePath;
    if (path == null) return;
    if (_previewPlaying) {
      await _preview.pause();
    } else if (_previewPosition > Duration.zero) {
      await _preview.resume();
    } else {
      await _preview.play(DeviceFileSource(path));
    }
  }

  Future<void> _discardVoice() async {
    if (_voice == _VoiceState.recording) {
      _recordTimer?.cancel();
      await _recorder.cancel();
    }
    await _preview.stop();
    _deleteVoiceFile();
    if (mounted) {
      setState(() {
        _voice = _VoiceState.idle;
        _recordStart = null;
        _recordElapsed = Duration.zero;
        _previewPosition = Duration.zero;
      });
    }
  }

  Future<void> _sendVoice() async {
    if (_voice == _VoiceState.recording && !await _finishRecording()) return;
    if (_voice != _VoiceState.recorded) return;
    await _preview.stop();
    final path = _voicePath;
    final duration = _recordElapsed;
    if (path == null) return;
    try {
      final bytes = await File(path).readAsBytes();
      widget.onVoiceRecorded(bytes, duration);
    } catch (_) {
      _snack('Could not read the recording. Please try again.');
    } finally {
      _deleteVoiceFile();
      if (mounted) {
        setState(() {
          _voice = _VoiceState.idle;
          _recordElapsed = Duration.zero;
          _previewPosition = Duration.zero;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasText = widget.controller.text.trim().isNotEmpty;
    final showSend = hasText || widget.editing != null;
    final recordingUi =
        _voice == _VoiceState.recording || _voice == _VoiceState.recorded;
    return SafeArea(
      top: false,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.busyLabel != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
              child: Row(
                children: [
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.busyLabel!,
                    style: TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          if (widget.editing != null)
            _Banner(
              icon: Icons.edit,
              title: 'Editing message',
              body: widget.editing!.text,
              onClose: widget.onCancelEdit,
            )
          else if (widget.replyingTo != null)
            _Banner(
              icon: Icons.reply,
              title: widget.replyingTo!.senderPhone == widget.myPhone
                  ? 'Replying to yourself'
                  : 'Replying to ${widget.replyingTo!.displayName}',
              body: widget.replyingTo!.text,
              onClose: widget.onCancelReply,
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
            child: recordingUi ? _voiceBar() : _composeRow(showSend),
          ),
          if (_showEmoji)
            SizedBox(
              height: 280,
              child: EmojiPicker(
                textEditingController: widget.controller,
                config: const Config(
                  height: 280,
                  bottomActionBarConfig: BottomActionBarConfig(enabled: false),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _composeRow(bool showSend) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.fieldBorder),
            ),
            child: _inputRow(),
          ),
        ),
        const SizedBox(width: 6),
        if (showSend)
          _roundButton(
            icon: widget.editing != null ? Icons.check : Icons.send,
            tooltip: widget.editing != null ? 'Save' : 'Send',
            onTap: widget.onSend,
          )
        else if (_voice == _VoiceState.starting)
          const SizedBox(
            width: 48,
            height: 48,
            child: Padding(
              padding: EdgeInsets.all(12),
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
          )
        else
          _roundButton(
            icon: Icons.mic,
            tooltip: 'Record voice message',
            onTap: _startRecording,
          ),
      ],
    );
  }

  /// Replaces the text box while a voice note is being recorded or reviewed:
  /// delete | timer or preview player | (stop) | send.
  Widget _voiceBar() {
    final recording = _voice == _VoiceState.recording;
    final total = _recordElapsed;
    final progress = !recording && total.inMilliseconds > 0
        ? (_previewPosition.inMilliseconds / total.inMilliseconds).clamp(
            0.0,
            1.0,
          )
        : 0.0;
    return Row(
      children: [
        IconButton(
          tooltip: 'Delete recording',
          icon: const Icon(
            Icons.delete_outline,
            color: AppColors.danger,
            size: 26,
          ),
          onPressed: _discardVoice,
        ),
        Expanded(
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.fieldBorder),
            ),
            child: recording
                ? Row(
                    children: [
                      const _BlinkingDot(),
                      const SizedBox(width: 8),
                      Text(
                        ChatFormat.duration(total),
                        style: const TextStyle(fontSize: 15),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Recording…',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  )
                : Row(
                    children: [
                      GestureDetector(
                        onTap: _togglePreview,
                        child: Icon(
                          _previewPlaying
                              ? Icons.pause_circle_filled
                              : Icons.play_circle_fill,
                          color: AppColors.violet,
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 4,
                            backgroundColor: AppColors.fieldBorder,
                            valueColor: const AlwaysStoppedAnimation(
                              AppColors.violet,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        ChatFormat.duration(
                          _previewPosition > Duration.zero
                              ? _previewPosition
                              : total,
                        ),
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
        if (recording)
          IconButton(
            tooltip: 'Stop and listen',
            icon: const Icon(
              Icons.stop_circle_outlined,
              color: AppColors.danger,
              size: 30,
            ),
            onPressed: _stopRecording,
          ),
        const SizedBox(width: 4),
        _roundButton(
          icon: Icons.send,
          tooltip: 'Send voice message',
          onTap: _sendVoice,
        ),
      ],
    );
  }

  Widget _inputRow() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        IconButton(
          icon: Icon(
            _showEmoji ? Icons.keyboard : Icons.emoji_emotions_outlined,
            color: AppColors.textMuted,
          ),
          onPressed: _toggleEmoji,
        ),
        Expanded(
          child: TextField(
            controller: widget.controller,
            focusNode: _focus,
            minLines: 1,
            maxLines: 5,
            textCapitalization: TextCapitalization.sentences,
            keyboardType: TextInputType.multiline,
            decoration: const InputDecoration(
              hintText: 'Message',
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              filled: false,
              isDense: true,
              contentPadding: EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        if (widget.editing == null)
          IconButton(
            icon: Icon(Icons.attach_file, color: AppColors.textMuted),
            onPressed: widget.onAttach,
          ),
      ],
    );
  }

  Widget _roundButton({
    required IconData icon,
    required String tooltip,
    VoidCallback? onTap,
  }) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: AppColors.violet,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: SizedBox(
            width: 48,
            height: 48,
            child: Icon(icon, color: Colors.white),
          ),
        ),
      ),
    );
  }
}

class _BlinkingDot extends StatefulWidget {
  const _BlinkingDot();

  @override
  State<_BlinkingDot> createState() => _BlinkingDotState();
}

class _BlinkingDotState extends State<_BlinkingDot>
    with SingleTickerProviderStateMixin {
  late final _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 700),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: Tween(begin: 0.25, end: 1.0).animate(_controller),
      child: const Icon(
        Icons.fiber_manual_record,
        color: AppColors.danger,
        size: 18,
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  final IconData icon;
  final String title;
  final String body;
  final VoidCallback onClose;

  const _Banner({
    required this.icon,
    required this.title,
    required this.body,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(8, 6, 8, 0),
      padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: const Border(
          left: BorderSide(color: AppColors.violet, width: 4),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.violet),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.violet,
                    fontSize: 12.5,
                  ),
                ),
                Text(
                  body,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 18),
            onPressed: onClose,
          ),
        ],
      ),
    );
  }
}
