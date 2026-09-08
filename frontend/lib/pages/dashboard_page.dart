import 'package:flutter/material.dart';
import '../models/biodata.dart';
import '../models/session.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/ipc_logo.dart';
import '../widgets/profession_category_card.dart';

class DashboardPage extends StatefulWidget {
  final UserSession session;
  final ValueChanged<String> onCategoryTap;
  final Future<void> Function() onLogout;

  const DashboardPage({
    super.key,
    required this.session,
    required this.onCategoryTap,
    required this.onLogout,
  });

  @override
  State<DashboardPage> createState() => DashboardPageState();
}

class DashboardPageState extends State<DashboardPage> {
  late Future<BiodataOptions> _optionsFuture;

  @override
  void initState() {
    super.initState();
    _optionsFuture = ApiService.fetchOptions();
  }

  void refresh() {
    setState(() {
      _optionsFuture = ApiService.fetchOptions();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Log out',
            onPressed: () => _confirmLogout(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => refresh(),
        child: ListView(
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
            const SizedBox(height: 28),
            const Text(
              'Browse by Profession',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 4),
            const Text(
              'Tap a category to see everyone in that group',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
            const SizedBox(height: 12),
            FutureBuilder<BiodataOptions>(
              future: _optionsFuture,
              builder: (context, optionsSnapshot) {
                if (optionsSnapshot.connectionState != ConnectionState.done) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                if (!optionsSnapshot.hasData) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'Could not load profession categories.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
                  );
                }
                final categories = optionsSnapshot.data!.professionCategories;
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.85,
                  ),
                  itemCount: categories.length,
                  itemBuilder: (context, index) {
                    final category = categories[index];
                    return ProfessionCategoryCard(
                      category: category,
                      onTap: () => widget.onCategoryTap(category),
                    );
                  },
                );
              },
            ),
          ],
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
