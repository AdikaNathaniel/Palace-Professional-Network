import 'package:flutter/material.dart';

/// The colours that change between light and dark mode.
class AppPalette {
  final Color background;
  final Color surface;
  final Color fieldBorder;
  final Color textDark;
  final Color textMuted;

  /// Violet used for text and accents on [surface]/[background]; the deep
  /// violet doesn't read on a dark background, so dark mode lightens it.
  final Color violetText;

  const AppPalette({
    required this.background,
    required this.surface,
    required this.fieldBorder,
    required this.textDark,
    required this.textMuted,
    required this.violetText,
  });

  static const light = AppPalette(
    background: Color(0xFFF5F3FF),
    surface: Colors.white,
    fieldBorder: Color(0xFFDDD6FE),
    textDark: Color(0xFF1E1B2E),
    textMuted: Color(0xFF6B7280),
    violetText: Color(0xFF5B21B6),
  );

  static const dark = AppPalette(
    background: Color(0xFF14121C),
    surface: Color(0xFF221E2E),
    fieldBorder: Color(0xFF3B3452),
    textDark: Color(0xFFF1EEF9),
    textMuted: Color(0xFFA1A1B5),
    violetText: Color(0xFFC4B5FD),
  );
}

class AppColors {
  AppColors._();

  static const Color violet = Color(0xFF7C3AED);
  static const Color violetLight = Color(0xFFA78BFA);
  static const Color danger = Color(0xFFDC2626);

  static const List<Color> heroGradient = [violet, Color(0xFF5B21B6)];

  /// The palette in use. Switched by ThemeService, which then rebuilds the
  /// whole app so every widget picks up the new colours.
  static AppPalette palette = AppPalette.light;

  static Color get background => palette.background;
  static Color get surface => palette.surface;
  static Color get cardBackground => palette.surface;
  static Color get fieldBorder => palette.fieldBorder;
  static Color get textDark => palette.textDark;
  static Color get textMuted => palette.textMuted;
  static Color get violetDark => palette.violetText;
}

class AppTheme {
  AppTheme._();

  static ThemeData get light => _build(Brightness.light, AppPalette.light);
  static ThemeData get dark => _build(Brightness.dark, AppPalette.dark);

  static ThemeData _build(Brightness brightness, AppPalette p) {
    final base = brightness == Brightness.dark
        ? ThemeData.dark(useMaterial3: true)
        : ThemeData.light(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: p.background,
      colorScheme: base.colorScheme.copyWith(
        primary: AppColors.violet,
        secondary: AppColors.violetLight,
        surface: p.surface,
        onSurface: p.textDark,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.violet,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: base.cardTheme.copyWith(
        color: p.surface,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: p.fieldBorder),
        ),
      ),
      dialogTheme: base.dialogTheme.copyWith(backgroundColor: p.surface),
      bottomSheetTheme: base.bottomSheetTheme.copyWith(
        backgroundColor: p.surface,
      ),
      dividerTheme: base.dividerTheme.copyWith(color: p.fieldBorder),
      listTileTheme: base.listTileTheme.copyWith(
        textColor: p.textDark,
        subtitleTextStyle: TextStyle(color: p.textMuted, fontSize: 13),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: p.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: p.fieldBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: p.fieldBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.violet, width: 2),
        ),
        labelStyle: TextStyle(color: p.textMuted),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.violet,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: p.surface,
        selectedItemColor: brightness == Brightness.dark
            ? AppColors.violetLight
            : AppColors.violet,
        unselectedItemColor: p.textMuted,
        showUnselectedLabels: true,
      ),
      textTheme: base.textTheme.apply(
        bodyColor: p.textDark,
        displayColor: p.textDark,
      ),
    );
  }
}
