import 'package:flutter/material.dart';
import '../models/biodata.dart';
import '../models/session.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/profile_avatar.dart';
import 'settings_page.dart';

/// "Account" tab: who's signed in, plus My Biodata, Settings and Log out.
class AccountPage extends StatefulWidget {
  final UserSession session;
  final VoidCallback onOpenBiodata;
  final Future<void> Function() onLogout;

  const AccountPage({
    super.key,
    required this.session,
    required this.onOpenBiodata,
    required this.onLogout,
  });

  @override
  State<AccountPage> createState() => AccountPageState();
}

class AccountPageState extends State<AccountPage> {
  late Future<Biodata?> _mineFuture;

  @override
  void initState() {
    super.initState();
    _mineFuture = ApiService.fetchMine();
  }

  /// Re-reads the profile (e.g. after the biodata form is updated).
  void refresh() {
    setState(() {
      _mineFuture = ApiService.fetchMine();
    });
  }

  Future<void> _confirmLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('You will need your phone number and PIN to log back in.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (confirmed == true) await widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 12),
          children: [
            FutureBuilder<Biodata?>(
              future: _mineFuture,
              builder: (context, snapshot) {
                final mine = snapshot.data;
                final name = mine?.fullName ??
                    (widget.session.fullName?.isNotEmpty == true
                        ? widget.session.fullName!
                        : widget.session.phoneNumber);
                return Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  child: Row(
                    children: [
                      ProfileAvatar(imageUrl: mine?.imageUrl, name: name, radius: 32),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 17,
                                color: AppColors.textDark,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              widget.session.phoneNumber,
                              style: const TextStyle(color: AppColors.textMuted),
                            ),
                            if (mine != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                mine.professionCategory,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: AppColors.violetDark,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const Divider(height: 1),
            _item(
              icon: Icons.badge_outlined,
              title: 'My Biodata',
              subtitle: 'Edit your profile',
              onTap: widget.onOpenBiodata,
            ),
            _item(
              icon: Icons.settings_outlined,
              title: 'Settings',
              subtitle: 'Change your PIN',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsPage()),
              ),
            ),
            const Divider(height: 24, indent: 20, endIndent: 20),
            _item(
              icon: Icons.logout,
              title: 'Log out',
              color: AppColors.danger,
              onTap: _confirmLogout,
            ),
          ],
        ),
      ),
    );
  }

  Widget _item({
    required IconData icon,
    required String title,
    String? subtitle,
    Color? color,
    required VoidCallback onTap,
  }) {
    final accent = color ?? AppColors.violet;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: CircleAvatar(
        backgroundColor: accent.withValues(alpha: 0.1),
        child: Icon(icon, color: accent),
      ),
      title: Text(
        title,
        style: TextStyle(fontWeight: FontWeight.w600, color: color ?? AppColors.textDark),
      ),
      subtitle: subtitle == null
          ? null
          : Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: color == null ? const Icon(Icons.chevron_right) : null,
      onTap: onTap,
    );
  }
}
