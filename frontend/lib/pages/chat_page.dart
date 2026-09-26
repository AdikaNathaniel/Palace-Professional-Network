import 'dart:async';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import '../models/chat_message.dart';
import '../models/session.dart';
import '../services/api_service.dart';
import '../services/chat_media_service.dart';
import '../services/chat_service.dart';
import '../theme/app_theme.dart';
import '../utils/chat_format.dart';
import '../widgets/chat/chat_composer.dart';
import '../widgets/chat/chat_sheets.dart';
import '../widgets/chat/message_bubble.dart';

class ChatPage extends StatefulWidget {
  final UserSession session;
  final String roomId;
  final String title;
  final String? subtitle;

  const ChatPage({
    super.key,
    required this.session,
    required this.roomId,
    required this.title,
    this.subtitle,
  });

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  static const _editWindow = Duration(minutes: 15);
  static const _typingResend = Duration(seconds: 3);
  static const _typingIdle = Duration(seconds: 4);
  static const _typingExpiry = Duration(seconds: 6);

  final _chat = ChatService();
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final _composerKey = GlobalKey<ChatComposerState>();
  final List<ChatMessage> _messages = [];

  /// phone -> when they last had this chat open (read receipts).
  final Map<String, DateTime> _reads = {};

  /// phone -> display name of people currently typing.
  final Map<String, String> _typers = {};
  final Map<String, Timer> _typerTimers = {};

  bool _connecting = true;
  String? _connectionError;
  Timer? _timeoutTimer;

  ChatMessage? _replyingTo;
  ChatMessage? _editing;
  String? _busyLabel;

  DateTime? _typingSentAt;
  Timer? _typingStopTimer;

  DateTime? _otherLastSeen;
  Timer? _presenceTimer;

  String get _myPhone => widget.session.phoneNumber;
  bool get _isDm => widget.roomId.startsWith('dm::');

  String? get _otherPhone {
    if (!_isDm) return null;
    final parts = widget.roomId.split('::');
    return parts[1] == _myPhone ? parts[2] : parts[1];
  }

  @override
  void initState() {
    super.initState();
    _startConnecting();
    if (_isDm) {
      _loadPresence();
      _presenceTimer = Timer.periodic(
        const Duration(seconds: 30),
        (_) => _loadPresence(),
      );
    }
  }

  Future<void> _loadPresence() async {
    final lastSeen = await ChatMediaService.lastSeen(_otherPhone!);
    if (mounted) setState(() => _otherLastSeen = lastSeen);
  }

  void _startConnecting() {
    setState(() {
      _connecting = true;
      _connectionError = null;
    });

    // connect() must run first: it's what creates the underlying socket.
    // The on* methods attach listeners to that socket via a null-safe
    // call, so registering them before the socket exists silently drops
    // them - which left nothing listening for the server's replies and the
    // spinner never cleared.
    _chat.connect(
      token: widget.session.token,
      onConnect: () => _chat.joinRoom(widget.roomId),
      onError: (message) {
        if (!mounted) return;
        _timeoutTimer?.cancel();
        setState(() {
          _connecting = false;
          _connectionError = message;
        });
      },
    );
    _chat.onHistory((roomId, messages, reads) {
      if (!mounted || roomId != widget.roomId) return;
      _timeoutTimer?.cancel();
      setState(() {
        _messages
          ..clear()
          ..addAll(messages);
        for (final r in reads) {
          _reads[r.phoneNumber] = r.lastReadAt;
        }
        _connecting = false;
      });
      _scrollToBottom(animate: false);
    });
    _chat.onMessage((message) {
      if (!mounted || message.roomId != widget.roomId) return;
      final nearBottom = _isNearBottom;
      setState(() {
        _messages.add(message);
        _clearTyper(message.senderPhone);
      });
      if (message.senderPhone != _myPhone) {
        // Seen right away if the chat is on screen, so the sender's ticks
        // turn blue live.
        if (WidgetsBinding.instance.lifecycleState ==
            AppLifecycleState.resumed) {
          _chat.markRead(widget.roomId);
        }
      }
      if (nearBottom || message.senderPhone == _myPhone) _scrollToBottom();
    });
    _chat.onMessageUpdated((updated) {
      if (!mounted || updated.roomId != widget.roomId) return;
      final i = _messages.indexWhere((m) => m.id == updated.id);
      if (i >= 0) setState(() => _messages[i] = updated);
    });
    _chat.onRead((roomId, read) {
      if (!mounted || roomId != widget.roomId) return;
      final current = _reads[read.phoneNumber];
      if (current == null || read.lastReadAt.isAfter(current)) {
        setState(() => _reads[read.phoneNumber] = read.lastReadAt);
      }
    });
    _chat.onTyping((roomId, phone, name, isTyping) {
      if (!mounted || roomId != widget.roomId || phone == _myPhone) return;
      if (!isTyping) {
        setState(() => _clearTyper(phone));
        return;
      }
      _typerTimers[phone]?.cancel();
      _typerTimers[phone] = Timer(_typingExpiry, () {
        if (mounted) setState(() => _clearTyper(phone));
      });
      setState(
        () =>
            _typers[phone] = name?.isNotEmpty == true ? name! : _nameFor(phone),
      );
    });
    _chat.onChatError((message) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    });

    // Belt-and-braces: if nothing comes back within 15s (a server-side bug,
    // an unreachable host, etc.), surface that instead of spinning forever.
    _timeoutTimer = Timer(const Duration(seconds: 15), () {
      if (!mounted || !_connecting) return;
      setState(() {
        _connecting = false;
        _connectionError =
            'Could not load this chat. Check your connection and try again.';
      });
    });
  }

  void _clearTyper(String phone) {
    _typers.remove(phone);
    _typerTimers.remove(phone)?.cancel();
  }

  void _retry() {
    _chat.dispose();
    _startConnecting();
  }

  bool get _isNearBottom {
    if (!_scrollController.hasClients) return true;
    final position = _scrollController.position;
    return position.maxScrollExtent - position.pixels < 200;
  }

  void _scrollToBottom({bool animate = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      final target = _scrollController.position.maxScrollExtent;
      if (animate) {
        _scrollController.animateTo(
          target,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      } else {
        _scrollController.jumpTo(target);
      }
    });
  }

  String _nameFor(String phone) {
    if (phone == _myPhone) return 'You';
    for (final m in _messages.reversed) {
      if (m.senderPhone == phone && m.senderName?.isNotEmpty == true)
        return m.senderName!;
      for (final r in m.reactions) {
        if (r.phone == phone && r.name?.isNotEmpty == true) return r.name!;
      }
    }
    if (_isDm && phone == _otherPhone) return widget.title;
    return phone;
  }

  // ---------------------------------------------------------------- typing

  void _onTextChanged() {
    if (_editing != null) return;
    final hasText = _textController.text.trim().isNotEmpty;
    _typingStopTimer?.cancel();
    if (!hasText) {
      _stopTyping();
      return;
    }
    final now = DateTime.now();
    if (_typingSentAt == null ||
        now.difference(_typingSentAt!) > _typingResend) {
      _typingSentAt = now;
      _chat.setTyping(widget.roomId, true, name: widget.session.fullName);
    }
    _typingStopTimer = Timer(_typingIdle, _stopTyping);
  }

  void _stopTyping() {
    _typingStopTimer?.cancel();
    if (_typingSentAt == null) return;
    _typingSentAt = null;
    _chat.setTyping(widget.roomId, false, name: widget.session.fullName);
  }

  // --------------------------------------------------------------- sending

  void _send() {
    final text = _textController.text.trim();
    final editing = _editing;
    if (editing != null) {
      if (text.isNotEmpty && text != editing.text) {
        _chat.edit(widget.roomId, editing.id, text);
      }
      setState(() => _editing = null);
      _textController.clear();
      return;
    }
    if (text.isEmpty) return;
    _chat.sendMessage(
      roomId: widget.roomId,
      text: text,
      senderName: widget.session.fullName,
      replyToId: _replyingTo?.id,
    );
    _stopTyping();
    _textController.clear();
    setState(() => _replyingTo = null);
  }

  void _sendRich(
    String type, {
    ChatAttachment? attachment,
    String? text,
    Map<String, dynamic>? poll,
  }) {
    _chat.sendMessage(
      roomId: widget.roomId,
      type: type,
      text: text,
      attachment: attachment,
      poll: poll,
      senderName: widget.session.fullName,
      replyToId: _replyingTo?.id,
    );
    setState(() => _replyingTo = null);
  }

  /// Runs an upload with the "Sending…" line shown, surfacing failures.
  Future<ChatAttachment?> _upload(
    String label,
    Future<ChatAttachment> Function() upload,
  ) async {
    setState(() => _busyLabel = label);
    try {
      return await upload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e is ApiException
                  ? e.message
                  : 'Upload failed. Please try again.',
            ),
          ),
        );
      }
      return null;
    } finally {
      if (mounted) setState(() => _busyLabel = null);
    }
  }

  Future<void> _attach() async {
    final choice = await showAttachmentMenu(context);
    if (!mounted || choice == null) return;
    switch (choice) {
      case AttachmentChoice.camera:
        await _sendImage(ImageSource.camera);
      case AttachmentChoice.gallery:
        await _sendImage(ImageSource.gallery);
      case AttachmentChoice.document:
        await _sendDocument();
      case AttachmentChoice.sticker:
        await _sendSticker();
      case AttachmentChoice.poll:
        final poll = await showCreatePollSheet(context);
        if (poll != null) _sendRich(ChatMessageType.poll, poll: poll.toJson());
    }
  }

  Future<void> _sendImage(ImageSource source) async {
    final picked = await ImagePicker().pickImage(
      source: source,
      imageQuality: 75,
      maxWidth: 1600,
    );
    if (picked == null || !mounted) return;
    final bytes = await picked.readAsBytes();
    if (!mounted) return;
    final caption = await showImageCaptionDialog(context, bytes);
    if (caption == null || !mounted) return;
    final name = picked.name.contains('.') ? picked.name : '${picked.name}.jpg';
    final attachment = await _upload(
      'Sending photo…',
      () => ChatMediaService.upload(bytes, name),
    );
    if (attachment != null)
      _sendRich(ChatMessageType.image, attachment: attachment, text: caption);
  }

  Future<void> _sendDocument() async {
    final files = await FilePicker.pickFiles();
    if (files.isEmpty || !mounted) return;
    final file = files.first;
    final size = await file.length() ?? 0;
    if (size > ChatMediaService.maxUploadBytes) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Files must be 15 MB or smaller.')),
        );
      }
      return;
    }
    final bytes = await file.readAsBytes();
    final attachment = await _upload(
      'Sending ${file.name}…',
      () => ChatMediaService.upload(bytes, file.name),
    );
    if (attachment != null)
      _sendRich(ChatMessageType.file, attachment: attachment);
  }

  Future<void> _sendVoice(Uint8List bytes, Duration duration) async {
    final attachment = await _upload(
      'Sending voice message…',
      () => ChatMediaService.upload(bytes, 'voice.m4a', mimeType: 'audio/mp4'),
    );
    if (attachment != null) {
      _sendRich(
        ChatMessageType.voice,
        attachment: attachment.copyWith(durationMs: duration.inMilliseconds),
      );
    }
  }

  Future<void> _sendSticker() async {
    final choice = await showStickerPickerSheet(context);
    if (choice == null) return;
    final s = choice.sticker;
    _sendRich(
      choice.isGif ? ChatMessageType.image : ChatMessageType.sticker,
      attachment: ChatAttachment(
        url: s.url,
        width: s.width,
        height: s.height,
        mimeType: 'image/gif',
      ),
    );
  }

  // ------------------------------------------------------ message actions

  String? _myReaction(ChatMessage m) {
    for (final r in m.reactions) {
      if (r.phone == _myPhone) return r.emoji;
    }
    return null;
  }

  void _react(ChatMessage m, String emoji) {
    final current = _myReaction(m);
    _chat.react(
      widget.roomId,
      m.id,
      current == emoji ? null : emoji,
      name: widget.session.fullName,
    );
  }

  void _startReply(ChatMessage m) {
    setState(() {
      _editing = null;
      _replyingTo = m;
    });
    _composerKey.currentState?.focusInput();
  }

  Future<void> _onLongPress(ChatMessage m) async {
    final isMine = m.senderPhone == _myPhone;
    final sentAt = m.createdAt;
    final canEdit =
        isMine &&
        m.type == ChatMessageType.text &&
        sentAt != null &&
        DateTime.now().difference(sentAt) < _editWindow;
    final result = await showMessageActions(
      context,
      message: m,
      canEdit: canEdit,
      canDelete: isMine,
      myReaction: _myReaction(m),
    );
    if (!mounted || result == null) return;
    if (result.emoji != null) {
      _react(m, result.emoji!);
      return;
    }
    switch (result.action) {
      case MessageAction.reply:
        _startReply(m);
      case MessageAction.copy:
        await Clipboard.setData(ClipboardData(text: m.text));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Message copied'),
              duration: Duration(seconds: 1),
            ),
          );
        }
      case MessageAction.edit:
        setState(() {
          _replyingTo = null;
          _editing = m;
        });
        _textController.text = m.text;
        _composerKey.currentState?.focusInput();
      case MessageAction.delete:
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete message?'),
            content: const Text(
              'This message will be deleted for everyone in this chat.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                child: const Text('Delete for everyone'),
              ),
            ],
          ),
        );
        if (confirmed == true) _chat.delete(widget.roomId, m.id);
      case MessageAction.viewVotes:
        if (m.poll != null)
          showPollVotesSheet(context, poll: m.poll!, nameFor: _nameFor);
      case MessageAction.moreReactions:
        final emoji = await showEmojiPickerSheet(context);
        if (emoji != null) _react(m, emoji);
      case null:
        break;
    }
  }

  ReadStatus _readStatus(ChatMessage m) {
    if (m.senderPhone != _myPhone || m.deleted) return ReadStatus.none;
    if (!_isDm) return ReadStatus.sent;
    final readAt = _reads[_otherPhone];
    final sentAt = m.createdAt;
    if (readAt != null && sentAt != null && !sentAt.isAfter(readAt))
      return ReadStatus.read;
    return ReadStatus.sent;
  }

  @override
  void dispose() {
    _stopTyping();
    _timeoutTimer?.cancel();
    _presenceTimer?.cancel();
    for (final t in _typerTimers.values) {
      t.cancel();
    }
    _chat.dispose();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ------------------------------------------------------------------ UI

  String? get _statusLine {
    if (_typers.isNotEmpty) {
      if (_isDm) return 'typing…';
      final names = _typers.values.toList();
      return names.length == 1
          ? '${names.first} is typing…'
          : '${names.length} people are typing…';
    }
    if (_isDm) {
      final presence = ChatFormat.presence(_otherLastSeen);
      return presence.isEmpty ? null : presence;
    }
    return widget.subtitle;
  }

  @override
  Widget build(BuildContext context) {
    final status = _statusLine;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (_composerKey.currentState?.closeEmojiPanel() ?? false) return;
        Navigator.of(context).pop();
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          titleSpacing: 0,
          title: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: Colors.white24,
                child: _isDm
                    ? Text(
                        ChatFormat.initials(widget.title),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                        ),
                      )
                    : const Icon(Icons.groups, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (status != null)
                      Text(
                        status,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white70,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        body: Column(
          children: [
            Expanded(child: _body()),
            ChatComposer(
              key: _composerKey,
              controller: _textController,
              myPhone: _myPhone,
              replyingTo: _replyingTo,
              editing: _editing,
              busyLabel: _busyLabel,
              onCancelReply: () => setState(() => _replyingTo = null),
              onCancelEdit: () {
                setState(() => _editing = null);
                _textController.clear();
              },
              onSend: _send,
              onAttach: _attach,
              onTextChanged: _onTextChanged,
              onVoiceRecorded: _sendVoice,
            ),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    if (_connecting) return const Center(child: CircularProgressIndicator());
    if (_connectionError != null) {
      return _ChatErrorState(message: _connectionError!, onRetry: _retry);
    }
    if (_messages.isEmpty) {
      return const Center(
        child: Text(
          'No messages yet. Say hello!',
          style: TextStyle(color: AppColors.textMuted),
        ),
      );
    }
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(10, 12, 10, 8),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final previous = index > 0 ? _messages[index - 1] : null;
        final newDay =
            previous == null ||
            !ChatFormat.sameDay(previous.createdAt, message.createdAt);
        final isMine = message.senderPhone == _myPhone;
        final firstInRun =
            newDay || previous.senderPhone != message.senderPhone;
        return Column(
          children: [
            if (newDay && message.createdAt != null)
              _DaySeparator(label: ChatFormat.dayLabel(message.createdAt!)),
            MessageBubble(
              key: ValueKey(message.id),
              message: message,
              isMine: isMine,
              showSender: !_isDm && !isMine && firstInRun,
              reserveAvatarSpace: !_isDm && !isMine,
              myPhone: _myPhone,
              readStatus: _readStatus(message),
              onReply: () => _startReply(message),
              onLongPress: () => _onLongPress(message),
              onVote: (ids) => _chat.vote(widget.roomId, message.id, ids),
              onViewVotes: () => showPollVotesSheet(
                context,
                poll: message.poll!,
                nameFor: _nameFor,
              ),
              onTapReactions: () => showReactionsSheet(
                context,
                reactions: message.reactions,
                myPhone: _myPhone,
                onRemoveMine: () =>
                    _chat.react(widget.roomId, message.id, null),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _DaySeparator extends StatelessWidget {
  final String label;

  const _DaySeparator({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.fieldBorder),
          ),
          child: Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
          ),
        ),
      ),
    );
  }
}

class _ChatErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ChatErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppColors.violetLight),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMuted),
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
