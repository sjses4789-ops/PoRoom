import 'package:flutter/material.dart';

// 웹 채팅 말풍선 팔레트(src/lib/palette.ts CHAT_PALETTE)와 같은 색 — 고른 색이 말풍선 배경이자 프로필 사진
// 테두리색이 된다. 값은 Tailwind 색의 [50, 100, 200, 400, 600] 단계.
const Map<String, List<int>> _hues = {
  'neutral': [0xFFFAFAFA, 0xFFF5F5F5, 0xFFE5E5E5, 0xFFA3A3A3, 0xFF525252],
  'slate': [0xFFF8FAFC, 0xFFF1F5F9, 0xFFE2E8F0, 0xFF94A3B8, 0xFF475569],
  'zinc': [0xFFFAFAFA, 0xFFF4F4F5, 0xFFE4E4E7, 0xFFA1A1AA, 0xFF52525B],
  'stone': [0xFFFAFAF9, 0xFFF5F5F4, 0xFFE7E5E4, 0xFFA8A29E, 0xFF57534E],
  'red': [0xFFFEF2F2, 0xFFFEE2E2, 0xFFFECACA, 0xFFF87171, 0xFFDC2626],
  'rose': [0xFFFFF1F2, 0xFFFFE4E6, 0xFFFECDD3, 0xFFFB7185, 0xFFE11D48],
  'pink': [0xFFFDF2F8, 0xFFFCE7F3, 0xFFFBCFE8, 0xFFF472B6, 0xFFDB2777],
  'fuchsia': [0xFFFDF4FF, 0xFFFAE8FF, 0xFFF5D0FE, 0xFFE879F9, 0xFFC026D3],
  'purple': [0xFFFAF5FF, 0xFFF3E8FF, 0xFFE9D5FF, 0xFFC084FC, 0xFF9333EA],
  'violet': [0xFFF5F3FF, 0xFFEDE9FE, 0xFFDDD6FE, 0xFFA78BFA, 0xFF7C3AED],
  'indigo': [0xFFEEF2FF, 0xFFE0E7FF, 0xFFC7D2FE, 0xFF818CF8, 0xFF4F46E5],
  'blue': [0xFFEFF6FF, 0xFFDBEAFE, 0xFFBFDBFE, 0xFF60A5FA, 0xFF2563EB],
  'sky': [0xFFF0F9FF, 0xFFE0F2FE, 0xFFBAE6FD, 0xFF38BDF8, 0xFF0284C7],
  'cyan': [0xFFECFEFF, 0xFFCFFAFE, 0xFFA5F3FC, 0xFF22D3EE, 0xFF0891B2],
  'teal': [0xFFF0FDFA, 0xFFCCFBF1, 0xFF99F6E4, 0xFF2DD4BF, 0xFF0D9488],
  'emerald': [0xFFECFDF5, 0xFFD1FAE5, 0xFFA7F3D0, 0xFF34D399, 0xFF059669],
  'green': [0xFFF0FDF4, 0xFFDCFCE7, 0xFFBBF7D0, 0xFF4ADE80, 0xFF16A34A],
  'lime': [0xFFF7FEE7, 0xFFECFCCB, 0xFFD9F99D, 0xFFA3E635, 0xFF65A30D],
  'yellow': [0xFFFEFCE8, 0xFFFEF9C3, 0xFFFEF08A, 0xFFFACC15, 0xFFCA8A04],
  'amber': [0xFFFFFBEB, 0xFFFEF3C7, 0xFFFDE68A, 0xFFFBBF24, 0xFFD97706],
  'orange': [0xFFFFF7ED, 0xFFFFEDD5, 0xFFFED7AA, 0xFFFB923C, 0xFFEA580C],
  'gray': [0xFFF9FAFB, 0xFFF3F4F6, 0xFFE5E7EB, 0xFF9CA3AF, 0xFF4B5563],
};

// 연한 회색 계열은 100 단계, 나머지는 50 단계를 말풍선 배경으로 쓴다(웹과 같다).
const Set<String> _grayish = {'neutral', 'slate', 'zinc', 'stone', 'gray'};

class ChatColor {
  const ChatColor({required this.bubble, required this.border, required this.text});

  final Color bubble;
  final Color border;
  final Color text;
}

// 고른 색이 없으면 null.
ChatColor? chatColorFor(String? key) {
  if (key == null || key.isEmpty) return null;
  if (key == 'black') {
    return const ChatColor(bubble: Color(0xFF171717), border: Color(0xFF171717), text: Colors.white);
  }
  final deep = key.endsWith('-deep');
  final hue = _hues[deep ? key.substring(0, key.length - 5) : key];
  if (hue == null) return null;
  final base = key.replaceAll('-deep', '');
  final bubble = deep ? hue[2] : (_grayish.contains(base) ? hue[1] : hue[0]);
  return ChatColor(
    bubble: Color(bubble),
    border: Color(deep ? hue[4] : hue[3]),
    text: const Color(0xFF171717),
  );
}
