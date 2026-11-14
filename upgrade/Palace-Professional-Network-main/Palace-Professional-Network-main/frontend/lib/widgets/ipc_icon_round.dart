import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Circular IPC mark. The source image is a full-bleed square photo, so it
/// fills the circle edge-to-edge (no internal padding/white backing, which
/// would otherwise show as a ring of white between the violet border and
/// the photo) with only a thin violet border framing it.
class IpcIconRound extends StatelessWidget {
  final double radius;

  const IpcIconRound({super.key, this.radius = 48});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.violetLight, width: 2),
        boxShadow: [
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.18),
            blurRadius: 12,
            spreadRadius: 1,
          ),
        ],
      ),
      child: ClipOval(
        child: Image.asset(
          'assets/images/app_icon.png',
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
        ),
      ),
    );
  }
}
