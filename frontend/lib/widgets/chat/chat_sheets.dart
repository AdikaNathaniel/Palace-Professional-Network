import 'dart:async';
import 'dart:typed_data';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import 'package:flutter/material.dart';
import '../../models/chat_message.dart';
import '../../services/api_service.dart';
import '../../services/chat_media_service.dart';
import '../../theme/app_theme.dart';

const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

Widget _handle() => Center(
  child: Container(
    width: 38,
    height: 4,
    margin: const EdgeInsets.only(top: 10, bottom: 8),
    decoration: BoxDecoration(
      color: AppColors.fieldBorder,
      borderRadius: BorderRadius.circular(2),
    ),
  ),
);

// ---------------------------------------------------------------------------
// Long-press menu

enum MessageAction { reply, copy, edit, delete, viewVotes, moreReactions }

class MessageActionResult {
  final MessageAction? action;
  final String? emoji;
  const MessageActionResult({this.action, this.emoji});
}

Future<MessageActionResult?> showMessageActions(
  BuildContext context, {
  required ChatMessage message,
  required bool canEdit,
  required bool canDelete,
  required String? myReaction,
}) {
  return showModalBottomSheet<MessageActionResult>(
    context: context,
    showDragHandle: false,
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _handle(),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                for (final emoji in quickReactions)
                  InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: () =>
                        Navigator.pop(ctx, MessageActionResult(emoji: emoji)),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: myReaction == emoji
                            ? AppColors.background
                            : null,
                      ),
                      child: Text(emoji, style: const TextStyle(fontSize: 28)),
                    ),
                  ),
                IconButton(
                  icon: Icon(
                    Icons.add_circle_outline,
                    color: AppColors.textMuted,
                  ),
                  onPressed: () => Navigator.pop(
                    ctx,
                    const MessageActionResult(
                      action: MessageAction.moreReactions,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          _action(ctx, Icons.reply, 'Reply', MessageAction.reply),
          if (message.type == ChatMessageType.text)
            _action(ctx, Icons.copy, 'Copy', MessageAction.copy),
          if (message.type == ChatMessageType.poll)
            _action(
              ctx,
              Icons.how_to_vote_outlined,
              'View votes',
              MessageAction.viewVotes,
            ),
          if (canEdit)
            _action(ctx, Icons.edit_outlined, 'Edit', MessageAction.edit),
          if (canDelete)
            _action(
              ctx,
              Icons.delete_outline,
              'Delete for everyone',
              MessageAction.delete,
              color: AppColors.danger,
            ),
          const SizedBox(height: 6),
        ],
      ),
    ),
  );
}

Widget _action(
  BuildContext ctx,
  IconData icon,
  String label,
  MessageAction action, {
  Color? color,
}) {
  return ListTile(
    leading: Icon(icon, color: color ?? AppColors.textDark),
    title: Text(label, style: TextStyle(color: color ?? AppColors.textDark)),
    onTap: () => Navigator.pop(ctx, MessageActionResult(action: action)),
  );
}

// ---------------------------------------------------------------------------
// Full emoji picker (for reactions beyond the quick six)

Future<String?> showEmojiPickerSheet(BuildContext context) {
  return showModalBottomSheet<String>(
    context: context,
    builder: (ctx) => SafeArea(
      child: SizedBox(
        height: 340,
        child: EmojiPicker(
          onEmojiSelected: (_, emoji) => Navigator.pop(ctx, emoji.emoji),
          config: const Config(
            height: 340,
            bottomActionBarConfig: BottomActionBarConfig(enabled: false),
          ),
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Who reacted

Future<void> showReactionsSheet(
  BuildContext context, {
  required List<ChatReaction> reactions,
  required String myPhone,
  required VoidCallback onRemoveMine,
}) {
  return showModalBottomSheet<void>(
    context: context,
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _handle(),
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              '${reactions.length} ${reactions.length == 1 ? 'reaction' : 'reactions'}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final r in reactions)
                  ListTile(
                    leading: Text(
                      r.emoji,
                      style: const TextStyle(fontSize: 26),
                    ),
                    title: Text(
                      r.phone == myPhone
                          ? 'You'
                          : (r.name?.isNotEmpty == true ? r.name! : r.phone),
                    ),
                    subtitle: r.phone == myPhone
                        ? const Text('Tap to remove')
                        : null,
                    onTap: r.phone == myPhone
                        ? () {
                            Navigator.pop(ctx);
                            onRemoveMine();
                          }
                        : null,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Poll votes breakdown

Future<void> showPollVotesSheet(
  BuildContext context, {
  required ChatPoll poll,
  required String Function(String phone) nameFor,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(ctx).size.height * 0.75,
        ),
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          children: [
            _handle(),
            Text(
              poll.question,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
            ),
            const SizedBox(height: 12),
            for (final option in poll.options) ...[
              Row(
                children: [
                  Expanded(
                    child: Text(
                      option.text,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  Text(
                    '${option.voters.length} ${option.voters.length == 1 ? 'vote' : 'votes'}',
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              if (option.voters.isEmpty)
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'No votes',
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      for (final phone in option.voters)
                        Chip(label: Text(nameFor(phone))),
                    ],
                  ),
                ),
            ],
          ],
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Create poll

class NewPoll {
  final String question;
  final List<String> options;
  final bool allowMultiple;
  const NewPoll(this.question, this.options, this.allowMultiple);

  Map<String, dynamic> toJson() => {
    'question': question,
    'options': options,
    'allowMultiple': allowMultiple,
  };
}

Future<NewPoll?> showCreatePollSheet(BuildContext context) {
  return showModalBottomSheet<NewPoll>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => const _CreatePollSheet(),
  );
}

class _CreatePollSheet extends StatefulWidget {
  const _CreatePollSheet();

  @override
  State<_CreatePollSheet> createState() => _CreatePollSheetState();
}

class _CreatePollSheetState extends State<_CreatePollSheet> {
  static const _maxOptions = 12;
  final _question = TextEditingController();
  final _options = [TextEditingController(), TextEditingController()];
  bool _allowMultiple = false;

  @override
  void dispose() {
    _question.dispose();
    for (final c in _options) {
      c.dispose();
    }
    super.dispose();
  }

  List<String> get _filled =>
      _options.map((c) => c.text.trim()).where((t) => t.isNotEmpty).toList();

  bool get _valid => _question.text.trim().isNotEmpty && _filled.length >= 2;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.85,
          ),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
            children: [
              _handle(),
              const Text(
                'Create poll',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _question,
                autofocus: true,
                maxLength: 300,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  labelText: 'Question',
                  counterText: '',
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 14),
              const Text(
                'Options',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              for (var i = 0; i < _options.length; i++)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: TextField(
                    controller: _options[i],
                    maxLength: 100,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: InputDecoration(
                      hintText: 'Option ${i + 1}',
                      counterText: '',
                      suffixIcon: _options.length > 2
                          ? IconButton(
                              icon: const Icon(Icons.close, size: 18),
                              onPressed: () => setState(
                                () => _options.removeAt(i).dispose(),
                              ),
                            )
                          : null,
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              if (_options.length < _maxOptions)
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    icon: const Icon(Icons.add),
                    label: const Text('Add option'),
                    onPressed: () =>
                        setState(() => _options.add(TextEditingController())),
                  ),
                ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Allow multiple answers'),
                value: _allowMultiple,
                onChanged: (v) => setState(() => _allowMultiple = v),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: _valid
                    ? () => Navigator.pop(
                        context,
                        NewPoll(_question.text.trim(), _filled, _allowMultiple),
                      )
                    : null,
                child: const Text('Send poll'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Stickers & GIFs

class StickerChoice {
  final StickerResult sticker;
  final bool isGif;
  const StickerChoice(this.sticker, this.isGif);
}

Future<StickerChoice?> showStickerPickerSheet(BuildContext context) {
  return showModalBottomSheet<StickerChoice>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => const _StickerPickerSheet(),
  );
}

class _StickerPickerSheet extends StatefulWidget {
  const _StickerPickerSheet();

  @override
  State<_StickerPickerSheet> createState() => _StickerPickerSheetState();
}

class _StickerPickerSheetState extends State<_StickerPickerSheet> {
  final _search = TextEditingController();
  Timer? _debounce;
  bool _gifs = false;
  Future<List<StickerResult>>? _results;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _load() {
    setState(() {
      _results = ChatMediaService.searchStickers(
        _search.text,
        kind: _gifs ? 'gifs' : 'stickers',
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.65,
          child: Column(
            children: [
              _handle(),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    ChoiceChip(
                      label: const Text('Stickers'),
                      selected: !_gifs,
                      onSelected: (_) {
                        _gifs = false;
                        _load();
                      },
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('GIFs'),
                      selected: _gifs,
                      onSelected: (_) {
                        _gifs = true;
                        _load();
                      },
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: TextField(
                  controller: _search,
                  decoration: const InputDecoration(
                    hintText: 'Search',
                    prefixIcon: Icon(Icons.search),
                    isDense: true,
                  ),
                  onChanged: (_) {
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 400), _load);
                  },
                ),
              ),
              Expanded(
                child: FutureBuilder<List<StickerResult>>(
                  future: _results,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      final error = snapshot.error;
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text(
                            error is ApiException
                                ? error.message
                                : 'Could not load stickers.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppColors.textMuted),
                          ),
                        ),
                      );
                    }
                    final items = snapshot.data ?? [];
                    if (items.isEmpty) {
                      return Center(
                        child: Text(
                          'Nothing found',
                          style: TextStyle(color: AppColors.textMuted),
                        ),
                      );
                    }
                    return GridView.builder(
                      padding: const EdgeInsets.all(12),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: _gifs ? 2 : 3,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                      ),
                      itemCount: items.length,
                      itemBuilder: (_, i) => InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () => Navigator.pop(
                          context,
                          StickerChoice(items[i], _gifs),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            items[i].previewUrl,
                            fit: _gifs ? BoxFit.cover : BoxFit.contain,
                            errorBuilder: (_, _, _) => const SizedBox.shrink(),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: EdgeInsets.only(bottom: 6),
                child: Text(
                  'Powered by GIPHY',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Attachment menu

enum AttachmentChoice { document, camera, gallery, sticker, poll }

Future<AttachmentChoice?> showAttachmentMenu(BuildContext context) {
  Widget item(
    BuildContext ctx,
    IconData icon,
    String label,
    Color color,
    AttachmentChoice value,
  ) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => Navigator.pop(ctx, value),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 27,
              backgroundColor: color,
              child: Icon(icon, color: Colors.white, size: 26),
            ),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(fontSize: 12.5)),
          ],
        ),
      ),
    );
  }

  return showModalBottomSheet<AttachmentChoice>(
    context: context,
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _handle(),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 12,
              runSpacing: 8,
              children: [
                item(
                  ctx,
                  Icons.insert_drive_file,
                  'Document',
                  const Color(0xFF6366F1),
                  AttachmentChoice.document,
                ),
                item(
                  ctx,
                  Icons.camera_alt,
                  'Camera',
                  const Color(0xFFDB2777),
                  AttachmentChoice.camera,
                ),
                item(
                  ctx,
                  Icons.photo,
                  'Gallery',
                  const Color(0xFF9333EA),
                  AttachmentChoice.gallery,
                ),
                item(
                  ctx,
                  Icons.emoji_emotions,
                  'Sticker / GIF',
                  const Color(0xFF0891B2),
                  AttachmentChoice.sticker,
                ),
                item(
                  ctx,
                  Icons.poll,
                  'Poll',
                  const Color(0xFF16A34A),
                  AttachmentChoice.poll,
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Photo preview with caption before sending

/// Returns the caption ('' for none) or null if the user cancelled.
Future<String?> showImageCaptionDialog(BuildContext context, Uint8List bytes) {
  final caption = TextEditingController();
  return Navigator.of(context).push<String>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (ctx) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
        ),
        body: Column(
          children: [
            Expanded(
              child: Center(child: Image.memory(bytes, fit: BoxFit.contain)),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: caption,
                        style: const TextStyle(color: Colors.white),
                        textCapitalization: TextCapitalization.sentences,
                        decoration: InputDecoration(
                          hintText: 'Add a caption…',
                          hintStyle: const TextStyle(color: Colors.white54),
                          filled: true,
                          fillColor: Colors.white12,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FloatingActionButton.small(
                      backgroundColor: AppColors.violet,
                      onPressed: () => Navigator.pop(ctx, caption.text.trim()),
                      child: const Icon(Icons.send, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
