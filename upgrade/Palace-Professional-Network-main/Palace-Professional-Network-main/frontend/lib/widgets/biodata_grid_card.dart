import 'package:flutter/material.dart';
import '../models/biodata.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/company_abbreviation.dart';

class BiodataGridCard extends StatelessWidget {
  final Biodata entry;
  final VoidCallback? onTap;

  const BiodataGridCard({super.key, required this.entry, this.onTap});

  /// Card height that fits its content - padding, photo, and two lines each
  /// of name and place of work - grown with the phone's text-size setting
  /// so text isn't cut off for people who use larger fonts.
  static double heightFor(BuildContext context) {
    const fixed = 32.0 + 60 + 8 + 6; // padding, photo, gaps
    const textAt1x = 13.5 * 1.15 * 2 + 11 * 1.15 * 2; // name + place lines
    return fixed + MediaQuery.textScalerOf(context).scale(textAt1x) + 6;
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = ApiService.resolveImageUrl(entry.imageUrl);
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
          decoration: BoxDecoration(
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
            // One-line names leave a little room; keep the content centred.
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppColors.background,
                backgroundImage: imageUrl.isNotEmpty ? NetworkImage(imageUrl) : null,
                child: imageUrl.isEmpty
                    ? const Icon(Icons.person, size: 32, color: AppColors.violetLight)
                    : null,
              ),
              const SizedBox(height: 8),
              Text(
                entry.fullName,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5, height: 1.15),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: EdgeInsets.only(top: 2),
                    child: Icon(Icons.work_outline, size: 12, color: AppColors.textMuted),
                  ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      CompanyAbbreviation.shorten(entry.placeOfWork),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 11, color: AppColors.textMuted, height: 1.15),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
