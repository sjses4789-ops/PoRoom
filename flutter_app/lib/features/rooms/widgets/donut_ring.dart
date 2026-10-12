import 'dart:math' as math;

import 'package:flutter/material.dart';

// 뽀모도로 진행률을 보여 주는 도넛(링) — 웹의 PomodoroDonut과 같은 역할.
class DonutRing extends StatelessWidget {
  const DonutRing({
    super.key,
    required this.progress,
    required this.color,
    this.size = 40,
    this.strokeWidth = 7,
    this.trackColor = const Color(0xFFE5E5E5),
    this.child,
  });

  final double progress; // 0..1
  final Color color;
  final double size;
  final double strokeWidth;
  final Color trackColor;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _DonutPainter(progress.clamp(0, 1).toDouble(), color, strokeWidth, trackColor),
        child: child == null ? null : Center(child: child),
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  _DonutPainter(this.progress, this.color, this.strokeWidth, this.trackColor);

  final double progress;
  final Color color;
  final double strokeWidth;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(strokeWidth / 2, strokeWidth / 2, size.width - strokeWidth, size.height - strokeWidth);
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..color = trackColor;
    canvas.drawArc(rect, 0, math.pi * 2, false, track);
    if (progress <= 0) return;
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..color = color;
    canvas.drawArc(rect, -math.pi / 2, math.pi * 2 * progress, false, arc);
  }

  @override
  bool shouldRepaint(_DonutPainter old) =>
      old.progress != progress || old.color != color || old.strokeWidth != strokeWidth || old.trackColor != trackColor;
}
