import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/chat_message.dart';
import 'api_service.dart';

/// App-wide unread chat counts behind the badges on the Chats tab and on
/// each conversation. There's no background socket (see ChatService), so the
/// counts are polled while the home screen is up, plus refreshed on demand
/// (tab switches, returning from a chat).
class UnreadService {
  UnreadService._();

  static final ValueNotifier<UnreadCounts> counts = ValueNotifier(
    const UnreadCounts(),
  );

  static const _pollInterval = Duration(seconds: 20);
  static Timer? _timer;

  static void startPolling() {
    _timer?.cancel();
    refresh();
    _timer = Timer.periodic(_pollInterval, (_) => refresh());
  }

  static void stopPolling() {
    pausePolling();
    counts.value = const UnreadCounts();
  }

  /// Stops polling but keeps the current counts (app went to background).
  /// Polling doubles as the "online" heartbeat, so it must stop then.
  static void pausePolling() {
    _timer?.cancel();
    _timer = null;
  }

  static Future<void> refresh() async {
    try {
      counts.value = await ApiService.fetchUnreadCounts();
    } catch (_) {
      // Keep the last known counts; the next poll will try again.
    }
  }

  /// Called when the user leaves a chat: clear its badge straight away, then
  /// re-sync once the server has recorded the read (it does that when the
  /// chat's socket disconnects, a moment after the screen closes).
  static void markRoomSeen(String roomId) {
    final current = counts.value;
    final seen = current.forRoom(roomId);
    if (seen > 0) {
      counts.value = UnreadCounts(
        total: current.total - seen,
        rooms: Map.of(current.rooms)..remove(roomId),
      );
    }
    Future.delayed(const Duration(seconds: 2), refresh);
  }
}
