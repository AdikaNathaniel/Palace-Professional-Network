import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// The source logo is a wide banner (~3:1), not a square emblem, so it is
/// shown on a rounded rectangular card rather than cropped into a circle
/// (which previously squeezed it down to an illegible sliver).
class IpcLogo extends StatelessWidget {
  final double maxWidth;

  const IpcLogo({super.key, this.maxWidth = 260});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(maxWidth: maxWidth),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.fieldBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.15),
            blurRadius: 12,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Image.asset(
        'assets/images/ipc_logo.png',
        fit: BoxFit.contain,
      ),
    );
  }
}
