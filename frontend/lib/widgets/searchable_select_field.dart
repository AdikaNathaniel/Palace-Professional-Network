import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// A form field for picking one item from a long list: tapping it opens a
/// bottom sheet with a search box that filters as you type. Items can be
/// grouped under headings (search matches the item or its heading); pass a
/// single group with an empty name for a flat list.
class SearchableSelectField extends FormField<String> {
  SearchableSelectField({
    super.key,
    required String? value,
    required Map<String, List<String>> groups,
    required ValueChanged<String> onChanged,
    String hint = 'Select',
    String sheetTitle = 'Select',
    String searchHint = 'Search',
    bool required = true,
  }) : super(
         initialValue: value,
         // Checks the parent's current value (not FormField's own copy), so
         // clearing it from outside - e.g. when the category changes - is
         // reflected in validation.
         validator: (_) => required && value == null ? 'Required' : null,
         builder: (field) {
           final context = field.context;
           Future<void> open() async {
             FocusScope.of(context).unfocus();
             final picked = await showModalBottomSheet<String>(
               context: context,
               isScrollControlled: true,
               useSafeArea: true,
               builder: (_) => _SearchSheet(
                 title: sheetTitle,
                 searchHint: searchHint,
                 groups: groups,
                 selected: value,
               ),
             );
             if (picked != null) {
               field.didChange(picked);
               onChanged(picked);
             }
           }

           return InkWell(
             borderRadius: BorderRadius.circular(12),
             onTap: open,
             child: InputDecorator(
               isEmpty: value == null,
               decoration: InputDecoration(
                 hintText: hint,
                 errorText: field.errorText,
                 suffixIcon: Icon(Icons.search, color: AppColors.textMuted),
               ),
               child: value == null
                   ? null
                   : Text(value, maxLines: 2, overflow: TextOverflow.ellipsis),
             ),
           );
         },
       );
}

class _SearchSheet extends StatefulWidget {
  final String title;
  final String searchHint;
  final Map<String, List<String>> groups;
  final String? selected;

  const _SearchSheet({
    required this.title,
    required this.searchHint,
    required this.groups,
    required this.selected,
  });

  @override
  State<_SearchSheet> createState() => _SearchSheetState();
}

class _SearchSheetState extends State<_SearchSheet> {
  final _search = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  /// Every word typed must appear somewhere in the item or its heading, so
  /// "civil eng" finds "Civil Engineer" and "bank teller" finds tellers
  /// listed under finance.
  bool _matches(String item, String group) {
    if (_query.isEmpty) return true;
    final haystack = '$item $group'.toLowerCase();
    return _query
        .toLowerCase()
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .every(haystack.contains);
  }

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    widget.groups.forEach((group, items) {
      final visible = items.where((i) => _matches(i, group)).toList();
      if (visible.isEmpty) return;
      if (group.isNotEmpty) {
        rows.add(
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
            child: Text(
              group,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.violet,
                fontSize: 13,
              ),
            ),
          ),
        );
      }
      for (final item in visible) {
        final selected = item == widget.selected;
        rows.add(
          ListTile(
            dense: true,
            contentPadding: EdgeInsets.fromLTRB(group.isEmpty ? 20 : 28, 0, 16, 0),
            title: Text(
              item,
              style: TextStyle(
                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                color: selected ? AppColors.violet : AppColors.textDark,
              ),
            ),
            trailing: selected ? const Icon(Icons.check_circle, color: AppColors.violet) : null,
            onTap: () => Navigator.pop(context, item),
          ),
        );
      }
    });

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.85,
        child: Column(
          children: [
            Center(
              child: Container(
                width: 38,
                height: 4,
                margin: const EdgeInsets.only(top: 10, bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.fieldBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: TextField(
                controller: _search,
                autofocus: true,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: widget.searchHint,
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _query.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _search.clear();
                            setState(() => _query = '');
                          },
                        ),
                ),
                onChanged: (v) => setState(() => _query = v.trim()),
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: rows.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          'No matches for "$_query"',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textMuted),
                        ),
                      ),
                    )
                  : ListView(
                      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                      padding: const EdgeInsets.only(bottom: 16),
                      children: rows,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
