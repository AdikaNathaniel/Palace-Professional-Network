import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/chat_message.dart';
import '../../theme/app_theme.dart';
import '../../utils/chat_format.dart';
import 'poll_card.dart';
import 'voice_message_player.dart';

/// Delivery state shown under the user's own messages in DMs.
enum ReadStatus { none, sent, read }

class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMine;
  final bool showSender;

  /// Group chats: keeps bubbles after the first in a run aligned with the
  /// first one, which has the sender's avatar.
  final bool reserveAvatarSpace;
  final String myPhone;
  final ReadStatus readStatus;
  final VoidCallback onReply;
  final VoidCallback onLongPress;
  final void Function(List<String> optionIds) onVote;
  final VoidCallback onViewVotes;
  final VoidCallback onTapReactions;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMine,
    required this.showSender,
    this.reserveAvatarSpace = false,
    required this.myPhone,
    required this.readStatus,
    required this.onReply,
    required this.onLongPress,
    required this.onVote,
    required this.onViewVotes,
    required this.onTapReactions,
  });

  bool get _isSticker =>
      message.type == ChatMessageType.sticker && !message.deleted;

  @override
  Widget build(BuildContext context) {
    final maxWidth = MediaQuery.of(context).size.width * 0.78;
    final bubble = GestureDetector(
      onLongPress: message.deleted ? null : onLongPress,
      child: Container(
        constraints: BoxConstraints(maxWidth: maxWidth),
        padding: _isSticker
            ? const EdgeInsets.all(2)
            : const EdgeInsets.fromLTRB(10, 7, 10, 6),
        decoration: _isSticker
            ? null
            : BoxDecoration(
                color: isMine ? AppColors.violet : AppColors.surface,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(14),
                  topRight: const Radius.circular(14),
                  bottomLeft: Radius.circular(isMine ? 14 : 3),
                  bottomRight: Radius.circular(isMine ? 3 : 14),
                ),
                border: isMine
                    ? null
                    : Border.all(color: AppColors.fieldBorder),
              ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showSender)
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Text(
                  message.displayName,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: ChatFormat.colorFor(message.senderPhone),
                  ),
                ),
              ),
            if (message.replyTo != null && !message.deleted)
              _ReplyQuote(
                reply: message.replyTo!,
                isMine: isMine,
                myPhone: myPhone,
              ),
            _content(context),
            const SizedBox(height: 3),
            _footer(),
          ],
        ),
      ),
    );

    return Padding(
      padding: EdgeInsets.only(bottom: message.reactions.isEmpty ? 6 : 16),
      child: _SwipeToReply(
        enabled: !message.deleted,
        onReply: onReply,
        child: Row(
          mainAxisAlignment: isMine
              ? MainAxisAlignment.end
              : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (showSender) ...[
              CircleAvatar(
                radius: 14,
                backgroundColor: ChatFormat.colorFor(
                  message.senderPhone,
                ).withValues(alpha: 0.15),
                child: Text(
                  ChatFormat.initials(message.displayName),
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                    color: ChatFormat.colorFor(message.senderPhone),
                  ),
                ),
              ),
              const SizedBox(width: 6),
            ] else if (reserveAvatarSpace)
              const SizedBox(width: 34),
            Flexible(
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  bubble,
                  if (message.reactions.isNotEmpty)
                    Positioned(
                      bottom: -14,
                      right: isMine ? 8 : null,
                      left: isMine ? null : 8,
                      child: _ReactionsChip(
                        reactions: message.reactions,
                        onTap: onTapReactions,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color get _fg => isMine ? Colors.white : AppColors.textDark;
  Color get _muted => isMine ? Colors.white70 : AppColors.textMuted;

  Widget _content(BuildContext context) {
    if (message.deleted) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.block, size: 15, color: _muted),
          const SizedBox(width: 5),
          Text(
            isMine ? 'You deleted this message' : 'This message was deleted',
            style: TextStyle(color: _muted, fontStyle: FontStyle.italic),
          ),
        ],
      );
    }
    final attachment = message.attachment;
    final caption = message.caption;
    Widget withCaption(Widget media) => caption.isEmpty
        ? media
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              media,
              const SizedBox(height: 5),
              Text(caption, style: TextStyle(color: _fg, fontSize: 15)),
            ],
          );

    switch (message.type) {
      case ChatMessageType.poll when message.poll != null:
        return PollCard(
          poll: message.poll!,
          myPhone: myPhone,
          isMine: isMine,
          onVote: onVote,
          onViewVotes: onViewVotes,
        );
      case ChatMessageType.image when attachment != null:
        return withCaption(
          _ImageContent(attachment: attachment, heroTag: 'img-${message.id}'),
        );
      case ChatMessageType.sticker when attachment != null:
        return Image.network(
          attachment.url,
          width: 140,
          height: 140,
          fit: BoxFit.contain,
          errorBuilder: (_, _, _) => const Text('💟 Sticker'),
        );
      case ChatMessageType.voice when attachment != null:
        return VoiceMessagePlayer(
          url: attachment.url,
          durationMs: attachment.durationMs,
          isMine: isMine,
        );
      case ChatMessageType.file when attachment != null:
        return withCaption(
          _FileContent(attachment: attachment, isMine: isMine),
        );
      default:
        return Text(message.text, style: TextStyle(color: _fg, fontSize: 15));
    }
  }

  Widget _footer() {
    final color = _isSticker ? AppColors.textMuted : _muted;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (message.editedAt != null && !message.deleted)
          Text(
            'edited  ',
            style: TextStyle(
              fontSize: 10.5,
              color: color,
              fontStyle: FontStyle.italic,
            ),
          ),
        Text(
          ChatFormat.time(message.createdAt),
          style: TextStyle(fontSize: 10.5, color: color),
        ),
        if (isMine && readStatus != ReadStatus.none) ...[
          const SizedBox(width: 3),
          Icon(
            readStatus == ReadStatus.read ? Icons.done_all : Icons.done,
            size: 15,
            color: readStatus == ReadStatus.read
                ? const Color(0xFF7DD3FC)
                : color,
          ),
        ],
      ],
    );
  }
}

class _ReplyQuote extends StatelessWidget {
  final ChatReply reply;
  final bool isMine;
  final String myPhone;

  const _ReplyQuote({
    required this.reply,
    required this.isMine,
    required this.myPhone,
  });

  @override
  Widget build(BuildContext context) {
    final name = reply.senderPhone == myPhone
        ? 'You'
        : (reply.senderName?.isNotEmpty == true
              ? reply.senderName!
              : reply.senderPhone ?? '');
    final accent = isMine
        ? Colors.white
        : ChatFormat.colorFor(reply.senderPhone ?? '');
    return Container(
      margin: const EdgeInsets.only(bottom: 5),
      padding: const EdgeInsets.fromLTRB(8, 5, 8, 5),
      decoration: BoxDecoration(
        color: isMine
            ? Colors.white.withValues(alpha: 0.16)
            : AppColors.background,
        borderRadius: BorderRadius.circular(8),
        border: Border(left: BorderSide(color: accent, width: 3.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            name,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: accent,
            ),
          ),
          const SizedBox(height: 1),
          Text(
            reply.text,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12.5,
              color: isMine ? Colors.white70 : AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _ImageContent extends StatelessWidget {
  final ChatAttachment attachment;
  final String heroTag;

  const _ImageContent({required this.attachment, required this.heroTag});

  @override
  Widget build(BuildContext context) {
    final w = attachment.width, h = attachment.height;
    final aspect = (w != null && h != null && w > 0 && h > 0)
        ? (w / h).clamp(0.6, 1.8)
        : 4 / 3;
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) =>
              FullScreenImagePage(url: attachment.url, heroTag: heroTag),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(
          width: 240,
          child: AspectRatio(
            aspectRatio: aspect.toDouble(),
            child: Hero(
              tag: heroTag,
              child: Image.network(
                attachment.url,
                fit: BoxFit.cover,
                loadingBuilder: (_, child, progress) => progress == null
                    ? child
                    : Container(
                        color: AppColors.background,
                        alignment: Alignment.center,
                        child: const CircularProgressIndicator(strokeWidth: 2),
                      ),
                errorBuilder: (_, _, _) => Container(
                  color: AppColors.background,
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.broken_image_outlined,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FileContent extends StatelessWidget {
  final ChatAttachment attachment;
  final bool isMine;

  const _FileContent({required this.attachment, required this.isMine});

  IconData get _icon {
    final name = (attachment.name ?? '').toLowerCase();
    if (name.endsWith('.pdf')) return Icons.picture_as_pdf;
    if (name.endsWith('.doc') || name.endsWith('.docx'))
      return Icons.description;
    if (name.endsWith('.xls') ||
        name.endsWith('.xlsx') ||
        name.endsWith('.csv')) {
      return Icons.table_chart;
    }
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return Icons.slideshow;
    return Icons.insert_drive_file;
  }

  @override
  Widget build(BuildContext context) {
    final fg = isMine ? Colors.white : AppColors.textDark;
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: () async {
        final ok = await launchUrl(
          Uri.parse(attachment.url),
          mode: LaunchMode.externalApplication,
        );
        if (!ok && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open this file.')),
          );
        }
      },
      child: Container(
        width: 240,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isMine
              ? Colors.white.withValues(alpha: 0.16)
              : AppColors.background,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(
              _icon,
              size: 34,
              color: isMine ? Colors.white : AppColors.violet,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    attachment.name ?? 'Document',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: fg, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    ChatFormat.fileSize(attachment.size),
                    style: TextStyle(
                      fontSize: 11.5,
                      color: fg.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.download_rounded, color: fg.withValues(alpha: 0.8)),
          ],
        ),
      ),
    );
  }
}

class _ReactionsChip extends StatelessWidget {
  final List<ChatReaction> reactions;
  final VoidCallback onTap;

  const _ReactionsChip({required this.reactions, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final emojis = <String>[];
    for (final r in reactions) {
      if (!emojis.contains(r.emoji)) emojis.add(r.emoji);
    }
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.fieldBorder),
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 3,
              offset: Offset(0, 1),
            ),
          ],
        ),
        child: Text(
          '${emojis.take(3).join()}${reactions.length > 1 ? ' ${reactions.length}' : ''}',
          style: TextStyle(fontSize: 13, color: AppColors.textDark),
        ),
      ),
    );
  }
}

/// Drag a message to the right to reply to it, like WhatsApp.
class _SwipeToReply extends StatefulWidget {
  final Widget child;
  final VoidCallback onReply;
  final bool enabled;

  const _SwipeToReply({
    required this.child,
    required this.onReply,
    required this.enabled,
  });

  @override
  State<_SwipeToReply> createState() => _SwipeToReplyState();
}

class _SwipeToReplyState extends State<_SwipeToReply> {
  static const _trigger = 56.0;
  double _dx = 0;
  bool _dragging = false;

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return widget.child;
    return GestureDetector(
      onHorizontalDragStart: (_) => setState(() => _dragging = true),
      onHorizontalDragUpdate: (d) =>
          setState(() => _dx = (_dx + d.delta.dx).clamp(0.0, _trigger + 16)),
      onHorizontalDragEnd: (_) {
        if (_dx >= _trigger) widget.onReply();
        setState(() {
          _dx = 0;
          _dragging = false;
        });
      },
      child: Stack(
        alignment: Alignment.centerLeft,
        children: [
          Opacity(
            opacity: (_dx / _trigger).clamp(0.0, 1.0),
            child: Padding(
              padding: EdgeInsets.only(left: 4),
              child: CircleAvatar(
                radius: 14,
                backgroundColor: AppColors.surface,
                child: Icon(Icons.reply, size: 18, color: AppColors.violet),
              ),
            ),
          ),
          AnimatedContainer(
            duration: _dragging
                ? Duration.zero
                : const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            transform: Matrix4.translationValues(_dx, 0, 0),
            child: widget.child,
          ),
        ],
      ),
    );
  }
}

class FullScreenImagePage extends StatelessWidget {
  final String url;
  final String heroTag;

  const FullScreenImagePage({
    super.key,
    required this.url,
    required this.heroTag,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new),
            tooltip: 'Open / save',
            onPressed: () =>
                launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
          ),
        ],
      ),
      body: Center(
        child: InteractiveViewer(
          maxScale: 5,
          child: Hero(
            tag: heroTag,
            child: Image.network(url, fit: BoxFit.contain),
          ),
        ),
      ),
    );
  }
}
