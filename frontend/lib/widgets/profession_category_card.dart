import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../utils/profession_images.dart';

class ProfessionCategoryCard extends StatelessWidget {
  final String category;
  final VoidCallback onTap;

  const ProfessionCategoryCard({
    super.key,
    required this.category,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
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
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: AspectRatio(
                  aspectRatio: 1.7,
                  child: Image.asset(
                    ProfessionImages.assetFor(category),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              // Expanded (not a fixed-height Padding) so the card can never
              // overflow: whatever room is left after the image, the text
              // area takes exactly that and no more. maxLines: 3 (not 2) -
              // long category names like "Non-Governmental Organisation
              // Professionals" need a third line, otherwise the last word
              // wraps onto an invisible line and gets ellipsis'd away.
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  child: Center(
                    child: Text(
                      ProfessionImages.shortLabel(category),
                      textAlign: TextAlign.center,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textDark,
                        height: 1.2,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
