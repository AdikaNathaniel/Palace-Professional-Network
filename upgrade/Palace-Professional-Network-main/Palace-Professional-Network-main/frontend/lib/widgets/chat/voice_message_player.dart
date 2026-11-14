import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../utils/chat_format.dart';

/// Play/pause + progress bar for a voice message. The audio is only fetched
/// when first played.
class VoiceMessagePlayer extends StatefulWidget {
  final String url;
  final int? durationMs;
  final bool isMine;

  const VoiceMessagePlayer({
    super.key,
    required this.url,
    this.durationMs,
    required this.isMine,
  });

  @override
  State<VoiceMessagePlayer> createState() => _VoiceMessagePlayerState();
}

class _VoiceMessagePlayerState extends State<VoiceMessagePlayer> {
  final _player = AudioPlayer();
  final _subs = <StreamSubscription>[];
  PlayerState _state = PlayerState.stopped;
  Duration _position = Duration.zero;
  Duration? _duration;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.durationMs != null)
      _duration = Duration(milliseconds: widget.durationMs!);
    void update(VoidCallback fn) {
      if (mounted) setState(fn);
    }

    _subs.addAll([
      _player.onPlayerStateChanged.listen((s) => update(() => _state = s)),
      _player.onPositionChanged.listen((p) => update(() => _position = p)),
      _player.onDurationChanged.listen((d) {
        if (d > Duration.zero) update(() => _duration = d);
      }),
      _player.onPlayerComplete.listen(
        (_) => update(() => _position = Duration.zero),
      ),
    ]);
  }

  @override
  void dispose() {
    for (final s in _subs) {
      s.cancel();
    }
    _player.dispose();
    super.dispose();
  }

  Future<void> _toggle() async {
    if (_state == PlayerState.playing) {
      await _player.pause();
      return;
    }
    if (_state == PlayerState.paused) {
      await _player.resume();
      return;
    }
    setState(() => _loading = true);
    try {
      await _player.play(UrlSource(widget.url));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not play this voice message.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fg = widget.isMine ? Colors.white : AppColors.violet;
    final total = _duration ?? Duration.zero;
    final progress = total.inMilliseconds > 0
        ? (_position.inMilliseconds / total.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;
    final playing = _state == PlayerState.playing;
    return SizedBox(
      width: 220,
      child: Row(
        children: [
          SizedBox(
            width: 40,
            height: 40,
            child: _loading
                ? Padding(
                    padding: const EdgeInsets.all(10),
                    child: CircularProgressIndicator(strokeWidth: 2, color: fg),
                  )
                : IconButton(
                    padding: EdgeInsets.zero,
                    icon: Icon(
                      playing
                          ? Icons.pause_circle_filled
                          : Icons.play_circle_fill,
                      size: 36,
                    ),
                    color: fg,
                    onPressed: _toggle,
                  ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 4,
                    backgroundColor: fg.withValues(alpha: 0.25),
                    valueColor: AlwaysStoppedAnimation(fg),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  ChatFormat.duration(
                    playing || _position > Duration.zero ? _position : total,
                  ),
                  style: TextStyle(
                    fontSize: 11,
                    color: fg.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          Icon(Icons.mic, size: 18, color: fg.withValues(alpha: 0.8)),
        ],
      ),
    );
  }
}
