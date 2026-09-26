import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'chat_media_service.dart';
import 'unread_service.dart';

/// Push notifications for new chat messages (Firebase Cloud Messaging).
///
/// Everything here is a silent no-op until Firebase is configured for the
/// app (android/app/google-services.json) - without it Firebase fails to
/// initialize and [_enabled] stays false, and the rest of the app is
/// unaffected.
class PushService {
  PushService._();

  static bool _enabled = false;
  static String? _token;
  static StreamSubscription<String>? _tokenRefreshSub;
  static StreamSubscription<RemoteMessage>? _openedSub;
  static StreamSubscription<RemoteMessage>? _foregroundSub;

  static Future<void> init() async {
    try {
      await Firebase.initializeApp();
      _enabled = true;
    } catch (e) {
      debugPrint('Push notifications disabled: $e');
    }
  }

  /// Call once the user is logged in. [onOpenChat] runs when they tap a
  /// notification (including the one that launched the app).
  static Future<void> startForUser({
    required void Function(String roomId, String title) onOpenChat,
  }) async {
    if (!_enabled) return;
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();

      _token = await messaging.getToken();
      if (_token != null) await ChatMediaService.registerDeviceToken(_token!);
      await _tokenRefreshSub?.cancel();
      _tokenRefreshSub = messaging.onTokenRefresh.listen((token) {
        _token = token;
        ChatMediaService.registerDeviceToken(token);
      });

      void open(RemoteMessage message) {
        final roomId = message.data['roomId'] as String?;
        if (roomId == null || roomId.isEmpty) return;
        onOpenChat(roomId, message.data['title'] as String? ?? 'Chat');
      }

      await _openedSub?.cancel();
      _openedSub = FirebaseMessaging.onMessageOpenedApp.listen(open);
      // While the app is open Android doesn't show the notification, but the
      // unread badges should catch up immediately rather than on next poll.
      await _foregroundSub?.cancel();
      _foregroundSub = FirebaseMessaging.onMessage.listen(
        (_) => UnreadService.refresh(),
      );

      final initial = await messaging.getInitialMessage();
      if (initial != null) open(initial);
    } catch (e) {
      debugPrint('Push setup failed: $e');
    }
  }

  /// Call on logout (while still authenticated) so this phone stops
  /// receiving the account's notifications.
  static Future<void> stopForUser() async {
    await _tokenRefreshSub?.cancel();
    await _openedSub?.cancel();
    await _foregroundSub?.cancel();
    _tokenRefreshSub = _openedSub = null;
    _foregroundSub = null;
    final token = _token;
    _token = null;
    if (!_enabled || token == null) return;
    try {
      await ChatMediaService.unregisterDeviceToken(token);
    } catch (_) {}
  }
}
