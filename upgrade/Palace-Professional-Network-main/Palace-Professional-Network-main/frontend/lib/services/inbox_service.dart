import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import '../config/api_config.dart';
import '../utils/chat_rooms.dart';
import 'api_service.dart';
import 'unread_service.dart';

/// Live "something changed in your chats" signal, so the chat list and
/// unread badges update the moment a message arrives instead of on the next
/// poll or a manual refresh.
///
/// One small socket while the home screen is up and the app is in the
/// foreground. It never joins a chat room (ChatService does that per open
/// chat) - the server only sends it `inbox` events carrying a room id: for
/// the user's DMs automatically, and for their profession group chat once
/// it's watched here.
class InboxService {
  InboxService._();

  /// Bumped on every change; listeners reload what they show.
  static final ValueNotifier<int> changes = ValueNotifier(0);

  static socket_io.Socket? _socket;
  static String? _token;

  static void start(String token) {
    _token = token;
    _connect();
  }

  /// App came back to the foreground: reconnect, and catch up on anything
  /// that arrived while it was away.
  static void resume() {
    if (_token == null) return;
    _connect();
    notifyChanged();
  }

  /// App went to the background.
  static void pause() => _disconnect();

  /// Logged out / home screen closed.
  static void stop() {
    _disconnect();
    _token = null;
  }

  /// Re-subscribe to the user's group chat (e.g. after their biodata - and
  /// so possibly their profession - changed).
  static void refreshWatch() => _watchMyGroup();

  static void notifyChanged() {
    UnreadService.refresh();
    changes.value++;
  }

  static void _connect() {
    _disconnect();
    final socket = socket_io.io(
      ApiConfig.baseUrl,
      socket_io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': _token})
          .disableAutoConnect()
          // Same reason as ChatService: always a fresh, authenticated
          // handshake rather than reusing another account's connection.
          .enableForceNew()
          .build(),
    );
    // Also runs after automatic reconnects, which start with no rooms.
    socket.onConnect((_) => _watchMyGroup());
    socket.on('inbox', (_) => notifyChanged());
    socket.connect();
    _socket = socket;
  }

  static Future<void> _watchMyGroup() async {
    try {
      final category = (await ApiService.fetchMine())?.professionCategory;
      if (category == null || category.isEmpty) return;
      _socket?.emit('watch', {
        'roomIds': [ChatRooms.category(category)],
      });
    } catch (_) {
      // DMs still update live; the group chat falls back to polling.
    }
  }

  static void _disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
