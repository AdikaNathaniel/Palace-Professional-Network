import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// A swipeable PageView with a violet "liquid" bulge (after Cuberto's
/// Liquid Swipe) that grows out of the screen edge the user is swiping from
/// and follows their finger vertically. It peaks mid-swipe and fades as the
/// next page settles. It only shows for finger swipes, not for programmatic
/// page changes (e.g. tapping the bottom bar), and not when the system asks
/// for reduced motion.
class EdgeBulgePageView extends StatefulWidget {
  final PageController controller;
  final List<Widget> children;
  final ValueChanged<int> onPageChanged;

  const EdgeBulgePageView({
    super.key,
    required this.controller,
    required this.children,
    required this.onPageChanged,
  });

  @override
  State<EdgeBulgePageView> createState() => _EdgeBulgePageViewState();
}

class _EdgeBulgePageViewState extends State<EdgeBulgePageView> {
  /// Page the current finger swipe started from; null when no swipe is in
  /// progress (so programmatic animations draw nothing).
  int? _swipeFrom;
  double? _fingerY;

  bool _onScroll(ScrollNotification n) {
    if (n.depth != 0) return false;
    if (n is ScrollStartNotification && n.dragDetails != null) {
      _swipeFrom = widget.controller.page?.round();
      _fingerY = n.dragDetails!.localPosition.dy;
    } else if (n is ScrollUpdateNotification && n.dragDetails != null) {
      _fingerY = n.dragDetails!.localPosition.dy;
    } else if (n is ScrollEndNotification) {
      // Let the last frame repaint at rest before clearing.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _swipeFrom = null);
      });
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    return Stack(
      children: [
        NotificationListener<ScrollNotification>(
          onNotification: _onScroll,
          child: PageView(
            controller: widget.controller,
            onPageChanged: widget.onPageChanged,
            children: [
              for (final child in widget.children) _KeepAlive(child: child),
            ],
          ),
        ),
        if (!reduceMotion)
          Positioned.fill(
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: widget.controller,
                builder: (context, _) {
                  final from = _swipeFrom;
                  final page = widget.controller.hasClients
                      ? widget.controller.page
                      : null;
                  if (from == null || page == null) {
                    return const SizedBox.shrink();
                  }
                  final delta = (page - from).clamp(-1.0, 1.0);
                  if (delta.abs() < 0.001) return const SizedBox.shrink();
                  return CustomPaint(
                    painter: _EdgeBulgePainter(
                      // Moving to the next page = swiping left = content
                      // leaves to the left, so the bulge enters from the right.
                      fromRight: delta > 0,
                      progress: delta.abs(),
                      centerY: _fingerY,
                    ),
                  );
                },
              ),
            ),
          ),
      ],
    );
  }
}

class _EdgeBulgePainter extends CustomPainter {
  final bool fromRight;

  /// 0 at rest, 1 when the next page has fully arrived.
  final double progress;
  final double? centerY;

  _EdgeBulgePainter({
    required this.fromRight,
    required this.progress,
    this.centerY,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Rises to a peak half way through the swipe, then melts away.
    final strength = math.sin(math.pi * progress);
    if (strength <= 0.01) return;

    final w = size.width;
    final depth = w * 0.42 * strength;
    final halfHeight = size.height * (0.16 + 0.14 * strength);
    final cy = (centerY ?? size.height / 2).clamp(
      halfHeight * 0.6,
      size.height - halfHeight * 0.6,
    );

    // Edge x and the direction the bulge grows in.
    final edge = fromRight ? w : 0.0;
    final dir = fromRight ? -1.0 : 1.0;
    final tip = edge + dir * depth;

    final path = Path()
      ..moveTo(edge, cy - halfHeight)
      ..cubicTo(
        edge,
        cy - halfHeight * 0.45,
        tip,
        cy - halfHeight * 0.6,
        tip,
        cy,
      )
      ..cubicTo(
        tip,
        cy + halfHeight * 0.6,
        edge,
        cy + halfHeight * 0.45,
        edge,
        cy + halfHeight,
      )
      ..close();

    final bounds = Rect.fromLTRB(
      math.min(edge, tip),
      cy - halfHeight,
      math.max(edge, tip),
      cy + halfHeight,
    );
    final opacity = 0.9 * strength;
    final paint = Paint()
      ..shader = LinearGradient(
        begin: fromRight ? Alignment.centerRight : Alignment.centerLeft,
        end: fromRight ? Alignment.centerLeft : Alignment.centerRight,
        colors: [
          AppColors.violetDark.withValues(alpha: opacity),
          AppColors.violet.withValues(alpha: opacity),
          AppColors.violetLight.withValues(alpha: opacity * 0.85),
        ],
      ).createShader(bounds);

    canvas.drawShadow(
      path,
      AppColors.violetDark.withValues(alpha: 0.4 * strength),
      6,
      false,
    );
    canvas.drawPath(path, paint);

    // A small chevron riding the bulge, pointing the way the page moves.
    if (depth > 36) {
      final chevronX = edge + dir * depth * 0.42;
      final s = 7.0 * strength + 3;
      final chevron = Path()
        ..moveTo(chevronX - dir * s * 0.5, cy - s)
        ..lineTo(chevronX + dir * s * 0.5, cy)
        ..lineTo(chevronX - dir * s * 0.5, cy + s);
      canvas.drawPath(
        chevron,
        Paint()
          ..color = Colors.white.withValues(alpha: strength)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.6
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round,
      );
    }
  }

  @override
  bool shouldRepaint(_EdgeBulgePainter old) =>
      old.progress != progress ||
      old.fromRight != fromRight ||
      old.centerY != centerY;
}

/// Keeps each tab alive off-screen so it keeps its scroll position, search
/// text and loaded data - the same as the previous IndexedStack did.
class _KeepAlive extends StatefulWidget {
  final Widget child;

  const _KeepAlive({required this.child});

  @override
  State<_KeepAlive> createState() => _KeepAliveState();
}

class _KeepAliveState extends State<_KeepAlive>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}
