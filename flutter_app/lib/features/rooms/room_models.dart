import 'package:flutter/material.dart';

class RoomSummary {
  const RoomSummary({
    required this.id,
    required this.name,
    required this.color,
    required this.isSystem,
    required this.joinType,
    required this.memberCount,
    required this.isMember,
    this.capacity,
    this.tags = const [],
    this.targetPosition,
  });

  final String id;
  final String name;
  final String color; // 웹 팔레트 키(예: 'rose', 'sky-deep')
  final bool isSystem;
  final String joinType; // 'open' | 'invite'
  final int memberCount;
  final bool isMember;
  final int? capacity;
  final List<String> tags;
  final String? targetPosition; // 'novelist' | 'webtoon' | null(누구나)

  bool get isOpen => joinType == 'open';
}

// 웹 방 색상 팔레트(src/lib/palette.ts)의 점 색 — 키가 '-deep'으로 끝나면 더 진한 톤.
const Map<String, Color> _base = {
  'neutral': Color(0xFF737373),
  'slate': Color(0xFF64748B),
  'zinc': Color(0xFF71717A),
  'stone': Color(0xFF78716C),
  'red': Color(0xFFEF4444),
  'rose': Color(0xFFF43F5E),
  'pink': Color(0xFFEC4899),
  'fuchsia': Color(0xFFD946EF),
  'purple': Color(0xFFA855F7),
  'violet': Color(0xFF8B5CF6),
  'indigo': Color(0xFF6366F1),
  'blue': Color(0xFF3B82F6),
  'sky': Color(0xFF0EA5E9),
  'cyan': Color(0xFF06B6D4),
  'teal': Color(0xFF14B8A6),
  'emerald': Color(0xFF10B981),
  'green': Color(0xFF22C55E),
  'lime': Color(0xFF84CC16),
  'yellow': Color(0xFFEAB308),
  'amber': Color(0xFFF59E0B),
  'orange': Color(0xFFF97316),
  'gray': Color(0xFF6B7280),
  'black': Color(0xFF171717),
};

Color roomColor(String key) {
  final deep = key.endsWith('-deep');
  final base = _base[deep ? key.substring(0, key.length - 5) : key] ?? _base['neutral']!;
  if (!deep) return base;
  return Color.alphaBlend(const Color(0x55000000), base);
}
