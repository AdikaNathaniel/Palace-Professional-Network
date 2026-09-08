import 'package:flutter/material.dart';
import '../models/biodata.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class BiodataDetailPage extends StatelessWidget {
  final Biodata entry;

  const BiodataDetailPage({super.key, required this.entry});

  @override
  Widget build(BuildContext context) {
    final imageUrl = ApiService.resolveImageUrl(entry.imageUrl);
    return Scaffold(
      appBar: AppBar(title: const Text('Professional Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: CircleAvatar(
              radius: 56,
              backgroundColor: AppColors.background,
              backgroundImage: imageUrl.isNotEmpty ? NetworkImage(imageUrl) : null,
              child: imageUrl.isEmpty
                  ? const Icon(Icons.person, size: 56, color: AppColors.violetLight)
                  : null,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            entry.fullName,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            entry.professionSubCategory ?? entry.professionCategory,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.violetDark, fontSize: 14),
          ),
          const SizedBox(height: 24),
          _DetailCard(
            children: [
              _DetailRow(icon: Icons.work_outline, label: 'Place of Work', value: entry.placeOfWork),
              _DetailRow(
                icon: Icons.category_outlined,
                label: 'Profession Category',
                value: entry.professionCategory,
              ),
              if (entry.professionSubCategory != null)
                _DetailRow(
                  icon: Icons.handyman_outlined,
                  label: 'Specific Trade / Business',
                  value: entry.professionSubCategory!,
                ),
            ],
          ),
          const SizedBox(height: 14),
          _DetailCard(
            children: [
              _DetailRow(icon: Icons.phone_outlined, label: 'Phone Number', value: entry.phoneNumber),
              if (entry.email != null && entry.email!.isNotEmpty)
                _DetailRow(icon: Icons.email_outlined, label: 'Email', value: entry.email!),
            ],
          ),
          const SizedBox(height: 14),
          _DetailCard(
            children: [
              _DetailRow(icon: Icons.cake_outlined, label: 'Age', value: entry.ageRange),
              _DetailRow(icon: Icons.wc_outlined, label: 'Gender', value: entry.gender),
              _DetailRow(
                icon: Icons.favorite_border,
                label: 'Marital Status',
                value: entry.maritalStatus,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  final List<Widget> children;

  const _DetailCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.fieldBorder),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(children: children),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppColors.violet),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
