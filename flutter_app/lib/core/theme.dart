import 'package:flutter/material.dart';

// PoRoom의 시그니처 색(웹의 뽀모도로 집중 색과 같다).
const Color kBrand = Color(0xFFC17B7B);
const Color kBreakBlue = Color(0xFF7B93C1);

// 웹(Tailwind neutral)과 같은 회색 계열을 그대로 써서 웹과 같은 분위기를 낸다.
class AppPalette extends ThemeExtension<AppPalette> {
  const AppPalette({
    required this.bg,
    required this.surface,
    required this.surfaceAlt,
    required this.text,
    required this.subtext,
    required this.muted,
    required this.line,
    required this.lineStrong,
  });

  final Color bg;
  final Color surface;
  final Color surfaceAlt;
  final Color text;
  final Color subtext;
  final Color muted;
  final Color line;
  final Color lineStrong;

  static const light = AppPalette(
    bg: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    surfaceAlt: Color(0xFFFAFAFA),
    text: Color(0xFF171717),
    subtext: Color(0xFF525252),
    muted: Color(0xFFA3A3A3),
    line: Color(0xFFE5E5E5),
    lineStrong: Color(0xFF171717),
  );

  static const dark = AppPalette(
    bg: Color(0xFF0A0A0A),
    surface: Color(0xFF171717),
    surfaceAlt: Color(0xFF1F1F1F),
    text: Color(0xFFFFFFFF),
    subtext: Color(0xFFD4D4D4),
    muted: Color(0xFF737373),
    line: Color(0xFF404040),
    lineStrong: Color(0xFFE5E5E5),
  );

  @override
  AppPalette copyWith({
    Color? bg,
    Color? surface,
    Color? surfaceAlt,
    Color? text,
    Color? subtext,
    Color? muted,
    Color? line,
    Color? lineStrong,
  }) {
    return AppPalette(
      bg: bg ?? this.bg,
      surface: surface ?? this.surface,
      surfaceAlt: surfaceAlt ?? this.surfaceAlt,
      text: text ?? this.text,
      subtext: subtext ?? this.subtext,
      muted: muted ?? this.muted,
      line: line ?? this.line,
      lineStrong: lineStrong ?? this.lineStrong,
    );
  }

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) {
    if (other is! AppPalette) return this;
    return AppPalette(
      bg: Color.lerp(bg, other.bg, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceAlt: Color.lerp(surfaceAlt, other.surfaceAlt, t)!,
      text: Color.lerp(text, other.text, t)!,
      subtext: Color.lerp(subtext, other.subtext, t)!,
      muted: Color.lerp(muted, other.muted, t)!,
      line: Color.lerp(line, other.line, t)!,
      lineStrong: Color.lerp(lineStrong, other.lineStrong, t)!,
    );
  }
}

extension PaletteContext on BuildContext {
  AppPalette get pal => Theme.of(this).extension<AppPalette>()!;
}

ThemeData buildTheme(Brightness brightness) {
  final pal = brightness == Brightness.dark
      ? AppPalette.dark
      : AppPalette.light;
  final base = ThemeData(
    brightness: brightness,
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: kBrand,
      brightness: brightness,
      surface: pal.surface,
    ).copyWith(primary: kBrand, onPrimary: Colors.white),
    scaffoldBackgroundColor: pal.bg,
    extensions: [pal],
  );
  return base.copyWith(
    textTheme: base.textTheme.apply(
      bodyColor: pal.text,
      displayColor: pal.text,
    ),
    dividerColor: pal.line,
    appBarTheme: AppBarTheme(
      backgroundColor: pal.bg,
      foregroundColor: pal.text,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
  );
}

// 홈 화면의 부드러운 색 카드(상시 작업방, 오늘의 목표 등) 배경 — 웹과 같은 로즈 포인트에 맞춘 옅은 틴트.
extension TintContext on BuildContext {
  bool get _dark => Theme.of(this).brightness == Brightness.dark;
  Color get tintRose =>
      _dark ? const Color(0xFF2B1F20) : const Color(0xFFF8ECEC);
  Color get tintLavender =>
      _dark ? const Color(0xFF22232F) : const Color(0xFFF0F0F8);
}
