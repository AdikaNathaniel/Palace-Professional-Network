import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/chat_format.dart';

/// Round profile photo that falls back to the person's initials when they
/// have no photo or it can't be loaded (e.g. an old upload that was lost).
class ProfileAvatar extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final double radius;
  final Color? background;
  final Color? foreground;

  const ProfileAvatar({
    super.key,
    required this.imageUrl,
    required this.name,
    this.radius = 20,
    this.background,
    this.foreground,
  });

  @override
  Widget build(BuildContext context) {
    final url = ApiService.resolveImageUrl(imageUrl);
    final color = ChatFormat.colorFor(name);
    return CircleAvatar(
      radius: radius,
      backgroundColor: background ?? color.withValues(alpha: 0.15),
      foregroundImage: url.isNotEmpty ? NetworkImage(url) : null,
      // Without this, a broken image URL throws instead of showing initials.
      onForegroundImageError: url.isNotEmpty ? (_, _) {} : null,
      child: Text(
        ChatFormat.initials(name),
        style: TextStyle(
          color: foreground ?? color,
          fontWeight: FontWeight.bold,
          fontSize: radius * 0.72,
        ),
      ),
    );
  }
}
