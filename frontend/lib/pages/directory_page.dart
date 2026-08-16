import 'package:flutter/material.dart';
import '../models/biodata.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class DirectoryPage extends StatefulWidget {
  const DirectoryPage({super.key});

  @override
  State<DirectoryPage> createState() => DirectoryPageState();
}

class DirectoryPageState extends State<DirectoryPage> {
  late Future<List<Biodata>> _entriesFuture;
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    _entriesFuture = ApiService.fetchAll();
  }

  void refresh() {
    setState(() => _entriesFuture = ApiService.fetchAll());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Professional Directory')),
      body: RefreshIndicator(
        onRefresh: () async => refresh(),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                decoration: InputDecoration(
                  hintText: 'Search by name, profession, or place of work',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _query.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _query = '');
                          },
                        )
                      : null,
                ),
              ),
            ),
            Expanded(
              child: FutureBuilder<List<Biodata>>(
                future: _entriesFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    return _ErrorState(
                      message: snapshot.error.toString(),
                      onRetry: refresh,
                    );
                  }
                  final entries = (snapshot.data ?? [])
                      .where((e) => _matches(e, _query))
                      .toList();
                  if (entries.isEmpty) {
                    return ListView(
                      children: const [
                        SizedBox(height: 80),
                        Center(
                          child: Text(
                            'No professionals found yet.',
                            style: TextStyle(color: AppColors.textMuted),
                          ),
                        ),
                      ],
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    itemCount: entries.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) => _BiodataCard(entry: entries[index]),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _matches(Biodata e, String query) {
    if (query.isEmpty) return true;
    return e.fullName.toLowerCase().contains(query) ||
        e.professionCategory.toLowerCase().contains(query) ||
        (e.professionSubCategory?.toLowerCase().contains(query) ?? false) ||
        e.placeOfWork.toLowerCase().contains(query);
  }
}

class _BiodataCard extends StatelessWidget {
  final Biodata entry;

  const _BiodataCard({required this.entry});

  @override
  Widget build(BuildContext context) {
    final imageUrl = ApiService.resolveImageUrl(entry.imageUrl);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: AppColors.background,
              backgroundImage: imageUrl.isNotEmpty ? NetworkImage(imageUrl) : null,
              child: imageUrl.isEmpty
                  ? const Icon(Icons.person_outline, color: AppColors.violetLight)
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.fullName,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    entry.professionSubCategory ?? entry.professionCategory,
                    style: const TextStyle(color: AppColors.violetDark, fontSize: 13),
                  ),
                  const SizedBox(height: 6),
                  _InfoRow(icon: Icons.work_outline, text: entry.placeOfWork),
                  if (entry.phoneNumber.isNotEmpty)
                    _InfoRow(icon: Icons.phone_outlined, text: entry.phoneNumber),
                  if (entry.email != null && entry.email!.isNotEmpty)
                    _InfoRow(icon: Icons.email_outlined, text: entry.email!),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppColors.violetLight),
            const SizedBox(height: 12),
            Text(
              'Could not load the directory.\n$message',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMuted),
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
