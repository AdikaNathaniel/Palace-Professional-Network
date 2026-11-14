import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';

/// Light / dark theme choice, made in Settings and remembered on the phone.
class ThemeService {
  ThemeService._();

  static const _prefsKey = 'theme_mode';

  static final ValueNotifier<ThemeMode> mode = ValueNotifier(ThemeMode.light);

  static bool get isDark => mode.value == ThemeMode.dark;

  /// Call before runApp so the first frame already has the right colours.
  static Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _apply(prefs.getString(_prefsKey) == 'dark');
    } catch (_) {
      // Stay on the light theme.
    }
  }

  static Future<void> setDark(bool dark) async {
    _apply(dark);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKey, dark ? 'dark' : 'light');
    } catch (_) {
      // Applied for this session even if it couldn't be saved.
    }
  }

  static void _apply(bool dark) {
    AppColors.palette = dark ? AppPalette.dark : AppPalette.light;
    mode.value = dark ? ThemeMode.dark : ThemeMode.light;
  }
}
