import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Notifications centre, opened from the Account page. Placeholder for now:
/// nothing is stored yet (chat messages still arrive as push notifications).
class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.notifications_none_rounded,
                size: 64,
                color: AppColors.violetLight,
              ),
              SizedBox(height: 12),
              Text(
                'No notifications yet',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppColors.textDark,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Announcements and updates from the network will appear here.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
