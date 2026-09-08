import 'package:flutter/material.dart';
import '../models/biodata.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class BiodataCard extends StatelessWidget {
  final Biodata entry;
  final VoidCallback? onTap;

  const BiodataCard({super.key, required this.entry, this.onTap});

  @override
  Widget build(BuildContext context) {
    final imageUrl = ApiService.resolveImageUrl(entry.imageUrl);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
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
