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
      _socket!.onConnectError((data) => onError(data?.toString() ?? 'Connection failed.'));
      _socket!.onError((data) => onError(data?.toString() ?? 'Connection error.'));
    }
    _socket!.connect();
  }

  void joinRoom(String roomId) {
    _socket?.emit('join', {'roomId': roomId});
  }

  void sendMessage({required String roomId, required String text, String? senderName}) {
    _socket?.emit('message', {
      'roomId': roomId,
      'text': text,
      'senderName': senderName,
    });
  }

  void onHistory(void Function(String roomId, List<ChatMessage> messages) callback) {
    _socket?.on('history', (data) {
      final map = Map<String, dynamic>.from(data as Map);
      final roomId = map['roomId'] as String;
      final messages = (map['messages'] as List)
          .map((m) => ChatMessage.fromJson(Map<String, dynamic>.from(m as Map)))
          .toList();
      callback(roomId, messages);
    });
  }

  void onMessage(void Function(ChatMessage message) callback) {
    _socket?.on('message', (data) {
      callback(ChatMessage.fromJson(Map<String, dynamic>.from(data as Map)));
    });
  }

  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
