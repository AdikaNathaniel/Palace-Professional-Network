import 'package:flutter/material.dart';
import '../models/biodata.dart';
import '../models/session.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/biodata_card.dart';
import '../widgets/ipc_logo.dart';

class DashboardPage extends StatefulWidget {
  final UserSession session;
  final VoidCallback onGoToForm;
  final VoidCallback onGoToDirectory;
  final Future<void> Function() onLogout;

  const DashboardPage({
    super.key,
    required this.session,
    required this.onGoToForm,
    required this.onGoToDirectory,
    required this.onLogout,
  });

  @override
  State<DashboardPage> createState() => DashboardPageState();
}

class DashboardPageState extends State<DashboardPage> {
  late Future<List<Biodata>> _entriesFuture;

  @override
  void initState() {
    super.initState();
    _entriesFuture = ApiService.fetchAll();
  }

  void refresh() {
    setState(() {
      _entriesFuture = ApiService.fetchAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          CircleAvatar(
            radius: 16,
            backgroundColor: Colors.white,
            child: ClipOval(
              child: Image.asset(
                'assets/images/ipc_logo.png',
                fit: BoxFit.cover,
                width: 32,
                height: 32,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Log out',
            onPressed: () => _confirmLogout(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => refresh(),
        child: FutureBuilder<List<Biodata>>(
          future: _entriesFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }

            final entries = snapshot.data ?? [];
            final hasError = snapshot.hasError;
            final categories = entries.map((e) => e.professionCategory).toSet();
            final recent = entries.take(3).toList();

            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              children: [
                const Center(child: IpcLogo(maxWidth: 220)),
                const SizedBox(height: 20),
                Text(
                  widget.session.fullName != null && widget.session.fullName!.isNotEmpty
                      ? 'Welcome back, ${widget.session.fullName}'
                      : 'Welcome to the Palace Professional Network',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Connecting IPC professionals for mentorship and support',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        icon: Icons.groups_outlined,
                        value: hasError ? '—' : '${entries.length}',
                        label: 'Professionals',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Icons.category_outlined,
                        value: hasError ? '—' : '${categories.length}',
                        label: 'Categories',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _QuickActionCard(
                  icon: Icons.edit_note_outlined,
                  title: 'Submit Your Biodata',
                  subtitle: 'Join the directory in a few minutes',
                  onTap: widget.onGoToForm,
                ),
                const SizedBox(height: 14),
                _QuickActionCard(
                  icon: Icons.people_outline,
                  title: 'View Directory',
                  subtitle: 'Browse fellow professionals & mentors',
                  onTap: widget.onGoToDirectory,
                  outlined: true,
                ),
                const SizedBox(height: 28),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recently Joined',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    TextButton(
                      onPressed: widget.onGoToDirectory,
                      child: const Text('See all'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (hasError)
                  Text(
                    'Could not load recent additions.\n${snapshot.error}',
                    style: const TextStyle(color: AppColors.textMuted),
                  )
                else if (recent.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Text(
                      'No professionals found yet. Be the first to submit your biodata!',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  )
                else
                  ...recent.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: BiodataCard(entry: e),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
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
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await widget.onLogout();
    }
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _StatCard({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.fieldBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.violet, size: 26),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textDark),
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool outlined;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: outlined
                ? null
                : const LinearGradient(
                    colors: AppColors.heroGradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
            color: outlined ? Colors.white : null,
            borderRadius: BorderRadius.circular(18),
            border: outlined ? Border.all(color: AppColors.violetLight, width: 1.2) : null,
            boxShadow: outlined
                ? null
                : [
                    BoxShadow(
                      color: AppColors.violet.withValues(alpha: 0.3),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: outlined
                      ? AppColors.violet.withValues(alpha: 0.1)
                      : Colors.white.withValues(alpha: 0.22),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: outlined ? AppColors.violet : Colors.white,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: outlined ? AppColors.textDark : Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: outlined ? AppColors.textMuted : Colors.white.withValues(alpha: 0.9),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                size: 14,
                color: outlined ? AppColors.violetLight : Colors.white,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
