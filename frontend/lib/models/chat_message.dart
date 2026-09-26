DateTime? _parseDate(dynamic value) =>
    value is String ? DateTime.tryParse(value)?.toLocal() : null;

/// Message kinds, mirroring the backend's CHAT_MESSAGE_TYPES.
class ChatMessageType {
  ChatMessageType._();
  static const text = 'text';
  static const image = 'image';
  static const file = 'file';
  static const voice = 'voice';
  static const sticker = 'sticker';
  static const poll = 'poll';
}

class ChatAttachment {
  final String url;
  final String? name;
  final String? mimeType;
  final int? size;
  final int? width;
  final int? height;
  final int? durationMs;

  const ChatAttachment({
    required this.url,
    this.name,
    this.mimeType,
    this.size,
    this.width,
    this.height,
    this.durationMs,
  });

  factory ChatAttachment.fromJson(Map<String, dynamic> json) => ChatAttachment(
    url: json['url'] as String? ?? '',
    name: json['name'] as String?,
    mimeType: json['mimeType'] as String?,
    size: (json['size'] as num?)?.toInt(),
    width: (json['width'] as num?)?.toInt(),
    height: (json['height'] as num?)?.toInt(),
    durationMs: (json['durationMs'] as num?)?.toInt(),
  );

  ChatAttachment copyWith({int? durationMs}) => ChatAttachment(
    url: url,
    name: name,
    mimeType: mimeType,
    size: size,
    width: width,
    height: height,
    durationMs: durationMs ?? this.durationMs,
  );

  Map<String, dynamic> toJson() => {
    'url': url,
    'name': ?name,
    'mimeType': ?mimeType,
    'size': ?size,
    'width': ?width,
    'height': ?height,
    'durationMs': ?durationMs,
  };
}

/// The quoted message shown above a reply.
class ChatReply {
  final String messageId;
  final String? senderPhone;
  final String? senderName;
  final String? type;
  final String text;

  const ChatReply({
    required this.messageId,
    this.senderPhone,
    this.senderName,
    this.type,
    required this.text,
  });

  factory ChatReply.fromJson(Map<String, dynamic> json) => ChatReply(
    messageId: json['messageId'] as String? ?? '',
    senderPhone: json['senderPhone'] as String?,
    senderName: json['senderName'] as String?,
    type: json['type'] as String?,
    text: json['text'] as String? ?? '',
  );
}

class ChatReaction {
  final String phone;
  final String? name;
  final String emoji;

  const ChatReaction({required this.phone, this.name, required this.emoji});

  factory ChatReaction.fromJson(Map<String, dynamic> json) => ChatReaction(
    phone: json['phone'] as String? ?? '',
    name: json['name'] as String?,
    emoji: json['emoji'] as String? ?? '',
  );
}

class ChatPollOption {
  final String id;
  final String text;
  final List<String> voters;

  const ChatPollOption({
    required this.id,
    required this.text,
    required this.voters,
  });

  factory ChatPollOption.fromJson(Map<String, dynamic> json) => ChatPollOption(
    id: json['id'] as String? ?? '',
    text: json['text'] as String? ?? '',
    voters: (json['voters'] as List? ?? []).map((v) => v as String).toList(),
  );
}

class ChatPoll {
  final String question;
  final bool allowMultiple;
  final List<ChatPollOption> options;

  const ChatPoll({
    required this.question,
    required this.allowMultiple,
    required this.options,
  });

  factory ChatPoll.fromJson(Map<String, dynamic> json) => ChatPoll(
    question: json['question'] as String? ?? '',
    allowMultiple: json['allowMultiple'] as bool? ?? false,
    options: (json['options'] as List? ?? [])
        .map(
          (o) => ChatPollOption.fromJson(Map<String, dynamic>.from(o as Map)),
        )
        .toList(),
  );

  /// Number of distinct people who voted for anything.
  int get voterCount => options.expand((o) => o.voters).toSet().length;

  Set<String> choicesOf(String phone) =>
      options.where((o) => o.voters.contains(phone)).map((o) => o.id).toSet();
}

class ChatMessage {
  final String id;
  final String roomId;
  final String senderPhone;
  final String? senderName;
  final String type;

  /// For text messages the message itself; otherwise a caption or a
  /// readable summary ("📷 Photo") that older app versions display as-is.
  final String text;
  final ChatAttachment? attachment;
  final ChatReply? replyTo;
  final List<ChatReaction> reactions;
  final ChatPoll? poll;
  final DateTime? editedAt;
  final bool deleted;
  final DateTime? createdAt;

  ChatMessage({
    this.id = '',
    required this.roomId,
    required this.senderPhone,
    this.senderName,
    this.type = ChatMessageType.text,
    required this.text,
    this.attachment,
    this.replyTo,
    this.reactions = const [],
    this.poll,
    this.editedAt,
    this.deleted = false,
    this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? map(String key) =>
        json[key] is Map ? Map<String, dynamic>.from(json[key] as Map) : null;
    final attachment = map('attachment');
    final replyTo = map('replyTo');
    final poll = map('poll');
    return ChatMessage(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      roomId: json['roomId'] as String? ?? '',
      senderPhone: json['senderPhone'] as String? ?? '',
      senderName: json['senderName'] as String?,
      type: json['type'] as String? ?? ChatMessageType.text,
      text: json['text'] as String? ?? '',
      attachment: attachment != null
          ? ChatAttachment.fromJson(attachment)
          : null,
      replyTo: replyTo != null ? ChatReply.fromJson(replyTo) : null,
      reactions: (json['reactions'] as List? ?? [])
          .map(
            (r) => ChatReaction.fromJson(Map<String, dynamic>.from(r as Map)),
          )
          .toList(),
      poll: poll != null ? ChatPoll.fromJson(poll) : null,
      editedAt: _parseDate(json['editedAt']),
      deleted: json['deleted'] as bool? ?? false,
      createdAt: _parseDate(json['createdAt']),
    );
  }

  String get displayName =>
      senderName?.isNotEmpty == true ? senderName! : senderPhone;

  /// Caption shown under media; empty when the text is only the fallback
  /// summary the server generates.
  String get caption {
    if (type == ChatMessageType.text || type == ChatMessageType.poll) return '';
    const summaries = {'📷 Photo', '🎤 Voice message', '💟 Sticker'};
    if (summaries.contains(text) ||
        text == '📄 ${attachment?.name ?? 'Document'}') {
      return '';
    }
    return text;
  }
}

/// When a room member last had the chat open (drives read receipts).
class RoomRead {
  final String phoneNumber;
  final DateTime lastReadAt;

  const RoomRead({required this.phoneNumber, required this.lastReadAt});

  static RoomRead? fromJson(Map<String, dynamic> json) {
    final at = _parseDate(json['lastReadAt']);
    final phone = json['phoneNumber'] as String?;
    if (at == null || phone == null) return null;
    return RoomRead(phoneNumber: phone, lastReadAt: at);
  }
}

class StickerResult {
  final String id;
  final String previewUrl;
  final String url;
  final int width;
  final int height;

  const StickerResult({
    required this.id,
    required this.previewUrl,
    required this.url,
    required this.width,
    required this.height,
  });

  factory StickerResult.fromJson(Map<String, dynamic> json) => StickerResult(
    id: json['id'] as String? ?? '',
    previewUrl: json['previewUrl'] as String? ?? '',
    url: json['url'] as String? ?? '',
    width: (json['width'] as num?)?.toInt() ?? 200,
    height: (json['height'] as num?)?.toInt() ?? 200,
  );
}

/// Unread message counts from GET /chat/unread. Rooms with nothing unread
/// are absent from [rooms].
class UnreadCounts {
  final int total;
  final Map<String, int> rooms;

  const UnreadCounts({this.total = 0, this.rooms = const {}});

  int forRoom(String roomId) => rooms[roomId] ?? 0;

  factory UnreadCounts.fromJson(Map<String, dynamic> json) {
    final rooms = <String, int>{};
    (json['rooms'] as Map? ?? {}).forEach((key, value) {
      rooms[key as String] = (value as num).toInt();
    });
    return UnreadCounts(
      total: (json['total'] as num?)?.toInt() ?? 0,
      rooms: rooms,
    );
  }
}

class DmRoomPreview {
  final String roomId;
  final String otherPhone;
  final String otherName;
  final String lastMessage;
  final DateTime? lastMessageAt;

  DmRoomPreview({
    required this.roomId,
    required this.otherPhone,
    required this.otherName,
    required this.lastMessage,
    this.lastMessageAt,
  });

  factory DmRoomPreview.fromJson(Map<String, dynamic> json) {
    return DmRoomPreview(
      roomId: json['roomId'] as String? ?? '',
      otherPhone: json['otherPhone'] as String? ?? '',
      otherName: json['otherName'] as String? ?? '',
      lastMessage: json['lastMessage'] as String? ?? '',
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.tryParse(json['lastMessageAt'] as String)
          : null,
    );
  }
}
