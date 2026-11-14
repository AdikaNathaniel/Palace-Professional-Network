import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import '../config/api_config.dart';
import '../models/chat_message.dart';

/// One instance per open chat screen: connect when the screen opens, join
/// its one room, dispose when the screen closes. Keeps the real-time
/// connection scoped to "actively looking at a chat" rather than running a
/// background connection for the whole app session.
class ChatService {
  socket_io.Socket? _socket;

  void connect({
    required String token,
    required void Function() onConnect,
    void Function(String message)? onError,
  }) {
    _socket = socket_io.io(
      ApiConfig.baseUrl,
      socket_io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .disableAutoConnect()
          // Without this, socket.io-client multiplexes onto whatever
          // connection is already open for this URL and skips the auth
          // handshake entirely - so after logging out and back in as a
          // different account, new sockets kept riding on the FIRST
          // account's already-authenticated connection, and every message
          // got stamped with that original account's phone number no
          // matter who was actually logged in. forceNew guarantees a
          // brand-new handshake (and a fresh server-side JWT check) every
          // time a chat screen connects.
          .enableForceNew()
          .build(),
    );
    // Registered here, right after the socket is created, rather than via a
    // separate public method someone could call before connect() - that
    // ordering hazard (attaching a listener to a not-yet-existent socket,
    // which no-ops silently) is exactly what caused chats to spin forever.
    _socket!.onConnect((_) => onConnect());
    if (onError != null) {
      _socket!.onConnectError(
        (data) => onError(data?.toString() ?? 'Connection failed.'),
      );
      _socket!.onError(
        (data) => onError(data?.toString() ?? 'Connection error.'),
      );
    }
    _socket!.connect();
  }

  void joinRoom(String roomId) {
    _socket?.emit('join', {'roomId': roomId});
  }

  /// Sends any kind of message. [type] is one of [ChatMessageType]; [text]
  /// is the message for text, an optional caption otherwise.
  void sendMessage({
    required String roomId,
    String type = ChatMessageType.text,
    String? text,
    String? senderName,
    ChatAttachment? attachment,
    String? replyToId,
    Map<String, dynamic>? poll,
  }) {
    _socket?.emit('message', {
      'roomId': roomId,
      'type': type,
      'text': text,
      'senderName': senderName,
      'attachment': ?attachment?.toJson(),
      'replyToId': ?replyToId,
      'poll': ?poll,
    });
  }

  /// A null [emoji] removes the user's reaction.
  void react(String roomId, String messageId, String? emoji, {String? name}) {
    _socket?.emit('react', {
      'roomId': roomId,
      'messageId': messageId,
      'emoji': emoji,
      'name': name,
    });
  }

  void edit(String roomId, String messageId, String text) {
    _socket?.emit('edit', {
      'roomId': roomId,
      'messageId': messageId,
      'text': text,
    });
  }

  void delete(String roomId, String messageId) {
    _socket?.emit('delete', {'roomId': roomId, 'messageId': messageId});
  }

  void vote(String roomId, String messageId, List<String> optionIds) {
    _socket?.emit('vote', {
      'roomId': roomId,
      'messageId': messageId,
      'optionIds': optionIds,
    });
  }

  void setTyping(String roomId, bool isTyping, {String? name}) {
    _socket?.emit('typing', {
      'roomId': roomId,
      'isTyping': isTyping,
      'name': name,
    });
  }

  void markRead(String roomId) {
    _socket?.emit('read', {'roomId': roomId});
  }

  void onHistory(
    void Function(
      String roomId,
      List<ChatMessage> messages,
      List<RoomRead> reads,
    )
    callback,
  ) {
    _socket?.on('history', (data) {
      final map = Map<String, dynamic>.from(data as Map);
      final roomId = map['roomId'] as String;
      final messages = (map['messages'] as List)
          .map((m) => ChatMessage.fromJson(Map<String, dynamic>.from(m as Map)))
          .toList();
      final reads = (map['reads'] as List? ?? [])
          .map((r) => RoomRead.fromJson(Map<String, dynamic>.from(r as Map)))
          .whereType<RoomRead>()
          .toList();
      callback(roomId, messages, reads);
    });
  }

  void onMessage(void Function(ChatMessage message) callback) {
    _socket?.on('message', (data) {
      callback(ChatMessage.fromJson(Map<String, dynamic>.from(data as Map)));
    });
  }

  /// A reaction, edit, delete or poll vote changed this message.
  void onMessageUpdated(void Function(ChatMessage message) callback) {
    _socket?.on('messageUpdated', (data) {
      callback(ChatMessage.fromJson(Map<String, dynamic>.from(data as Map)));
    });
  }

  void onTyping(
    void Function(
      String roomId,
      String phoneNumber,
      String? name,
      bool isTyping,
    )
    callback,
  ) {
    _socket?.on('typing', (data) {
      final map = Map<String, dynamic>.from(data as Map);
      callback(
        map['roomId'] as String? ?? '',
        map['phoneNumber'] as String? ?? '',
        map['name'] as String?,
        map['isTyping'] as bool? ?? false,
      );
    });
  }

  void onRead(void Function(String roomId, RoomRead read) callback) {
    _socket?.on('read', (data) {
      final map = Map<String, dynamic>.from(data as Map);
      final read = RoomRead.fromJson(map);
      if (read != null) callback(map['roomId'] as String? ?? '', read);
    });
  }

  void onChatError(void Function(String message) callback) {
    _socket?.on('chatError', (data) {
      final map = data is Map ? Map<String, dynamic>.from(data) : const {};
      callback(map['message'] as String? ?? 'Something went wrong.');
    });
  }

  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
