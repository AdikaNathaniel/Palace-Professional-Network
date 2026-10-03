import 'package:flutter/material.dart';
import '../services/theme_service.dart';
import '../theme/app_theme.dart';
import 'change_pin_page.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 12),
          children: [
            ListTile(
              leading: CircleAvatar(
                backgroundColor: AppColors.background,
                child: const Icon(Icons.lock_outline, color: AppColors.violet),
              ),
              title: const Text('Change PIN'),
              subtitle: const Text('Update the PIN you use to log in'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ChangePinPage()),
                );
              },
            ),
            const Divider(height: 24, indent: 20, endIndent: 20),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
              child: Text(
                'Theme',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: AppColors.textMuted,
                ),
              ),
            ),
            const _ThemeOption(
              dark: false,
              icon: Icons.light_mode_outlined,
              title: 'Light',
            ),
            const _ThemeOption(
              dark: true,
              icon: Icons.dark_mode_outlined,
              title: 'Dark',
            ),
          ],
        ),
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final bool dark;
  final IconData icon;
  final String title;

  const _ThemeOption({
    required this.dark,
    required this.icon,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    final selected = ThemeService.isDark == dark;
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AppColors.background,
        child: Icon(icon, color: AppColors.violet),
      ),
      title: Text(title),
      trailing: selected
          ? const Icon(Icons.check_circle, color: AppColors.violet)
          : Icon(Icons.circle_outlined, color: AppColors.fieldBorder),
      selected: selected,
      onTap: selected ? null : () => ThemeService.setDark(dark),
    );
  }
}
