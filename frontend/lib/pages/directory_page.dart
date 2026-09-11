import 'package:flutter/material.dart';
import '../models/biodata.dart';
import '../models/session.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/profession_images.dart';
import '../widgets/biodata_grid_card.dart';
import 'biodata_detail_page.dart';

class DirectoryPage extends StatefulWidget {
  final UserSession session;

  const DirectoryPage({super.key, required this.session});

  @override
  State<DirectoryPage> createState() => DirectoryPageState();
}

class DirectoryPageState extends State<DirectoryPage> {
  late Future<List<Biodata>> _entriesFuture;
  final _searchController = TextEditingController();
  String _query = '';
  String? _categoryFilter;

  @override
  void initState() {
    super.initState();
    _entriesFuture = ApiService.fetchAll();
  }

  void refresh() {
    // Block body, not `=>`: an arrow body would make the assignment
    // expression's value (a Future) the closure's return value, which
    // trips Flutter's "setState callback returned a Future" assertion.
    setState(() {
      _entriesFuture = ApiService.fetchAll();
    });
  }

  /// Called from the Dashboard's profession grid, via GlobalKey, to jump
  /// straight to a filtered view of one category.
  void applyCategoryFilter(String category) {
    setState(() {
      _categoryFilter = category;
      _query = '';
      _searchController.clear();
    });
  }

  void _clearCategoryFilter() {
    setState(() => _categoryFilter = null);
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
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: TextField(
                controller: _searchController,
                onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                decoration: InputDecoration(
                  hintText: 'Search by name or profession',
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
            if (_categoryFilter != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Chip(
                    avatar: const Icon(Icons.filter_alt, size: 16, color: AppColors.violet),
                    label: Text(ProfessionImages.shortLabel(_categoryFilter!)),
                    backgroundColor: AppColors.background,
                    side: const BorderSide(color: AppColors.fieldBorder),
                    onDeleted: _clearCategoryFilter,
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
                  return GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.6,
                    ),
                    itemCount: entries.length,
                    itemBuilder: (context, index) => BiodataGridCard(
                      entry: entries[index],
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => BiodataDetailPage(
                            entry: entries[index],
                            session: widget.session,
                          ),
                        ),
                      ),
                    ),
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
    if (_categoryFilter != null && e.professionCategory != _categoryFilter) {
      return false;
    }
    if (query.isEmpty) return true;
    return e.fullName.toLowerCase().contains(query) ||
        e.professionCategory.toLowerCase().contains(query) ||
        (e.professionSubCategory?.toLowerCase().contains(query) ?? false);
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
