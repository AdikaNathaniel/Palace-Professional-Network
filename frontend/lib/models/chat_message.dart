class ChatMessage {
  final String roomId;
  final String senderPhone;
  final String? senderName;
  final String text;
  final DateTime? createdAt;

  ChatMessage({
    required this.roomId,
    required this.senderPhone,
    this.senderName,
    required this.text,
    this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      roomId: json['roomId'] as String? ?? '',
      senderPhone: json['senderPhone'] as String? ?? '',
      senderName: json['senderName'] as String?,
      text: json['text'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
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
