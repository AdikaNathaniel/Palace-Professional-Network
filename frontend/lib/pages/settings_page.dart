import 'package:flutter/material.dart';
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
              leading: const CircleAvatar(
                backgroundColor: AppColors.background,
                child: Icon(Icons.lock_outline, color: AppColors.violet),
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
          ],
        ),
      ),
    );
  }
}
