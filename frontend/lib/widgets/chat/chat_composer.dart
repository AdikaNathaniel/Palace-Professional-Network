import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import '../../models/chat_message.dart';
import '../../theme/app_theme.dart';
import '../../utils/chat_format.dart';

/// Message input bar: text field with an emoji panel, attachment button,
/// send button (or hold-to-record mic when empty), plus the "Replying to" /
/// "Editing" banner above it and an upload progress line.
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

class ChatComposerState extends State<ChatComposer> {
  static const _minVoiceLength = Duration(seconds: 1);
  static const _cancelDragDistance = 100.0;

  final _focus = FocusNode();
  final _recorder = AudioRecorder();
  bool _showEmoji = false;
  bool _recording = false;
  bool _cancelRecording = false;
  DateTime? _recordStart;
  Duration _recordElapsed = Duration.zero;
  Timer? _recordTimer;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onText);
    _focus.addListener(() {
      if (_focus.hasFocus && _showEmoji) setState(() => _showEmoji = false);
    });
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onText);
    _focus.dispose();
    _recordTimer?.cancel();
    _recorder.dispose();
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

  Future<void> _startRecording() async {
    if (!await _recorder.hasPermission()) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Allow microphone access to send voice messages.'),
          ),
        );
      }
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
    setState(() {
      _recording = true;
      _cancelRecording = false;
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
  }

  Future<void> _stopRecording() async {
    if (!_recording) return;
    _recordTimer?.cancel();
    final elapsed = _recordStart == null
        ? Duration.zero
        : DateTime.now().difference(_recordStart!);
    final cancelled = _cancelRecording;
    setState(() {
      _recording = false;
      _recordStart = null;
    });
    final path = await _recorder.stop();
    if (path == null) return;
    final file = File(path);
    if (cancelled || elapsed < _minVoiceLength) {
      if (await file.exists()) await file.delete();
      if (!cancelled && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hold the mic button to record a voice message.'),
          ),
        );
      }
      return;
    }
    final bytes = await file.readAsBytes();
    await file.delete();
    widget.onVoiceRecorded(bytes, elapsed);
  }

  @override
  Widget build(BuildContext context) {
    final hasText = widget.controller.text.trim().isNotEmpty;
    final showSend = hasText || widget.editing != null;
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
                    style: const TextStyle(
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
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.fieldBorder),
                    ),
                    child: _recording ? _recordingIndicator() : _inputRow(),
                  ),
                ),
                const SizedBox(width: 6),
                showSend
                    ? _roundButton(
                        icon: widget.editing != null ? Icons.check : Icons.send,
                        onTap: widget.onSend,
                      )
                    : GestureDetector(
                        onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Hold the mic button to record, release to send.',
                            ),
                          ),
                        ),
                        onLongPressStart: (_) => _startRecording(),
                        onLongPressMoveUpdate: (d) {
                          final cancel =
                              d.offsetFromOrigin.dx < -_cancelDragDistance;
                          if (cancel != _cancelRecording)
                            setState(() => _cancelRecording = cancel);
                        },
                        onLongPressEnd: (_) => _stopRecording(),
                        child: AnimatedScale(
                          scale: _recording ? 1.35 : 1,
                          duration: const Duration(milliseconds: 150),
                          child: _roundButton(icon: Icons.mic, onTap: null),
                        ),
                      ),
              ],
            ),
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
            icon: const Icon(Icons.attach_file, color: AppColors.textMuted),
            onPressed: widget.onAttach,
          ),
      ],
    );
  }

  Widget _recordingIndicator() {
    return SizedBox(
      height: 48,
      child: Row(
        children: [
          const SizedBox(width: 14),
          Icon(
            _cancelRecording ? Icons.delete_outline : Icons.fiber_manual_record,
            color: AppColors.danger,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            ChatFormat.duration(_recordElapsed),
            style: const TextStyle(fontSize: 15),
          ),
          const Spacer(),
          Text(
            _cancelRecording ? 'Release to cancel' : '‹ Slide to cancel',
            style: TextStyle(
              color: _cancelRecording ? AppColors.danger : AppColors.textMuted,
              fontSize: 13,
            ),
          ),
          const SizedBox(width: 14),
        ],
      ),
    );
  }

  Widget _roundButton({required IconData icon, VoidCallback? onTap}) {
    return Material(
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
        color: Colors.white,
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
                  style: const TextStyle(
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
