import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../l10n/app_localizations.dart';

// 웹의 카드와 같은 모양(테두리 있는 사각형).
class BorderedCard extends StatelessWidget {
  const BorderedCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.onTap,
    this.color,
  });

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return Material(
      color: color ?? pal.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: pal.line),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

// 가로로 스크롤되는 알약형 선택 칩 줄.
class ChipRow<T> extends StatelessWidget {
  const ChipRow({
    super.key,
    required this.items,
    required this.selected,
    required this.onSelected,
  });

  final List<(T, String)> items;
  final T selected;
  final ValueChanged<T> onSelected;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final (value, label) = items[i];
          final on = value == selected;
          return InkWell(
            borderRadius: BorderRadius.circular(99),
            onTap: () => onSelected(value),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: on ? pal.lineStrong : Colors.transparent,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: on ? pal.lineStrong : pal.line),
              ),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: on ? pal.bg : pal.subtext,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// 불러오는 중 / 실패(다시 시도) / 결과를 한 곳에서 처리하는 FutureBuilder.
class AsyncBody<T> extends StatelessWidget {
  const AsyncBody({
    super.key,
    required this.future,
    required this.onRetry,
    required this.builder,
  });

  final Future<T>? future;
  final VoidCallback onRetry;
  final Widget Function(BuildContext context, T data) builder;

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return FutureBuilder<T>(
      future: future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return ListView(
            children: [
              const SizedBox(height: 120),
              Center(
                child: Text(l10n.loading, style: TextStyle(color: pal.muted)),
              ),
            ],
          );
        }
        if (snap.hasError) {
          return ListView(
            children: [
              const SizedBox(height: 120),
              Center(
                child: Text(
                  l10n.loadFailed,
                  style: TextStyle(color: pal.muted),
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: OutlinedButton(
                  onPressed: onRetry,
                  child: Text(l10n.retry),
                ),
              ),
            ],
          );
        }
        return builder(context, snap.data as T);
      },
    );
  }
}

String formatNumber(int n) {
  final neg = n < 0;
  final s = n.abs().toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return neg ? '-$b' : b.toString();
}

// 리치 에디터가 만든 HTML 본문을 글자만 남겨 보여 준다(앱 화면에서는 서식 없이 텍스트로).
String stripHtml(String html) {
  var s = html
      .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
      .replaceAll(
        RegExp(r'</(p|div|h[1-6]|li|blockquote)>', caseSensitive: false),
        '\n',
      )
      .replaceAll(RegExp(r'<[^>]+>'), '');
  s = s
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'");
  return s.replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();
}
