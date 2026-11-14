import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Formatting helpers for the chat screens (times, day separators,
/// presence, file sizes, per-person name colours).
class ChatFormat {
  ChatFormat._();

  /// The app polls every 20s while open, so a heartbeat within this window
  /// means the person has the app open right now.
  static const onlineWindow = Duration(seconds: 60);

  static DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

  static String time(DateTime? at) =>
      at == null ? '' : DateFormat('HH:mm').format(at);

  static String dayLabel(DateTime at) {
    final today = _day(DateTime.now());
    final day = _day(at);
    final diff = today.difference(day).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    if (diff < 7) return DateFormat('EEEE').format(at);
    return DateFormat('d MMMM yyyy').format(at);
  }

  static bool sameDay(DateTime? a, DateTime? b) =>
      a != null && b != null && _day(a) == _day(b);

  static String presence(DateTime? lastSeen) {
    if (lastSeen == null) return '';
    if (DateTime.now().difference(lastSeen) < onlineWindow) return 'online';
    final label = dayLabel(lastSeen);
    final when = label == 'Today' || label == 'Yesterday'
        ? label.toLowerCase()
        : DateFormat('d MMM').format(lastSeen);
    return 'last seen $when at ${time(lastSeen)}';
  }

  static String fileSize(int? bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  static String duration(Duration d) {
    final m = d.inMinutes;
    final s = d.inSeconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  static String initials(String name) {
    final parts = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }

  static const _nameColors = [
    Color(0xFF7C3AED),
    Color(0xFFDB2777),
    Color(0xFF0891B2),
    Color(0xFF16A34A),
    Color(0xFFEA580C),
    Color(0xFF2563EB),
    Color(0xFF9333EA),
    Color(0xFFB45309),
  ];

  /// Stable colour per person, like WhatsApp group sender names.
  static Color colorFor(String key) =>
      _nameColors[key.codeUnits.fold<int>(0, (a, b) => a + b) %
          _nameColors.length];
}
