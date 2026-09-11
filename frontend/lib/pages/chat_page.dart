import 'dart:async';
import 'package:flutter/material.dart';
import '../models/chat_message.dart';
import '../models/session.dart';
import '../services/chat_service.dart';
import '../theme/app_theme.dart';

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
  final _chat = ChatService();
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _connecting = true;
  String? _connectionError;
  Timer? _timeoutTimer;

  @override
  void initState() {
    super.initState();
    _startConnecting();
  }

  void _startConnecting() {
    setState(() {
      _connecting = true;
      _connectionError = null;
    });

    // connect() must run first: it's what creates the underlying socket.
    // onHistory/onMessage attach listeners to that socket via a null-safe
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
    _chat.onHistory((roomId, messages) {
      if (!mounted || roomId != widget.roomId) return;
      _timeoutTimer?.cancel();
      setState(() {
        _messages
          ..clear()
          ..addAll(messages);
        _connecting = false;
      });
      _scrollToBottom();
    });
    _chat.onMessage((message) {
      if (!mounted || message.roomId != widget.roomId) return;
      setState(() => _messages.add(message));
      _scrollToBottom();
    });

    // Belt-and-braces: if nothing comes back within 15s (a server-side bug,
    // an unreachable host, etc.), surface that instead of spinning forever.
    _timeoutTimer = Timer(const Duration(seconds: 15), () {
      if (!mounted || !_connecting) return;
      setState(() {
        _connecting = false;
        _connectionError = 'Could not load this chat. Check your connection and try again.';
      });
    });
  }

  void _retry() {
    _chat.dispose();
    _startConnecting();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  void _send() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    _chat.sendMessage(
      roomId: widget.roomId,
      text: text,
      senderName: widget.session.fullName,
    );
    _textController.clear();
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    _chat.dispose();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        bottom: widget.subtitle != null
            ? PreferredSize(
                preferredSize: const Size.fromHeight(20),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    widget.subtitle!,
                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                ),
              )
            : null,
      ),
      body: Column(
        children: [
          Expanded(
            child: _connecting
                ? const Center(child: CircularProgressIndicator())
                : _connectionError != null
                    ? _ChatErrorState(message: _connectionError!, onRetry: _retry)
                    : _messages.isEmpty
                    ? const Center(
                        child: Text(
                          'No messages yet. Say hello!',
                          style: TextStyle(color: AppColors.textMuted),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final message = _messages[index];
                          final isMine = message.senderPhone == widget.session.phoneNumber;
                          return _MessageBubble(message: message, isMine: isMine);
                        },
                      ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Type a message',
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: AppColors.fieldBorder),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: AppColors.fieldBorder),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: AppColors.violet, width: 2),
                        ),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Material(
                    color: AppColors.violet,
                    shape: const CircleBorder(),
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white),
                      onPressed: _send,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMine;

  const _MessageBubble({required this.message, required this.isMine});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMine ? AppColors.violet : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: Radius.circular(isMine ? 14 : 2),
            bottomRight: Radius.circular(isMine ? 2 : 14),
          ),
          border: isMine ? null : Border.all(color: AppColors.fieldBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMine)
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(
                  message.senderName ?? message.senderPhone,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold,
                    color: AppColors.violetDark,
                  ),
                ),
              ),
            Text(
              message.text,
              style: TextStyle(color: isMine ? Colors.white : AppColors.textDark),
            ),
          ],
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
