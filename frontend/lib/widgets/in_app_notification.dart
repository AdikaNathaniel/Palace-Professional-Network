import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// WhatsApp-style banner that slides down from the top while the app is
/// open (Android doesn't display push notifications for the app on screen).
/// Tap to open, swipe up or wait to dismiss. Only one shows at a time.
class InAppNotification {
  InAppNotification._();

  static OverlayEntry? _current;
  static Timer? _timer;

  static void show(
    BuildContext context, {
    required String title,
    required String body,
    required VoidCallback onTap,
  }) {
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) return;
    dismiss();
    final entry = OverlayEntry(
      builder: (_) => _Banner(
        title: title,
        body: body,
        onTap: () {
          dismiss();
          onTap();
        },
        onDismiss: dismiss,
      ),
    );
    _current = entry;
    overlay.insert(entry);
    _timer = Timer(const Duration(seconds: 4), dismiss);
  }

  static void dismiss() {
    _timer?.cancel();
    _timer = null;
    _current?.remove();
    _current = null;
  }
}

class _Banner extends StatelessWidget {
  final String title;
  final String body;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _Banner({
    required this.title,
    required this.body,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: -1, end: 0),
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
          builder: (context, value, child) => FractionalTranslation(
            translation: Offset(0, value),
            child: child,
          ),
          child: Dismissible(
            key: UniqueKey(),
            direction: DismissDirection.up,
            onDismissed: (_) => onDismiss(),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 0),
              child: Material(
                elevation: 8,
                borderRadius: BorderRadius.circular(16),
                color: Colors.white,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: onTap,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const CircleAvatar(
                          radius: 20,
                          backgroundColor: AppColors.violet,
                          child: Icon(Icons.chat_bubble, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textDark,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                body,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
