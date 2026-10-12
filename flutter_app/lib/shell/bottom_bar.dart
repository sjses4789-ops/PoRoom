import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../l10n/app_localizations.dart';

enum AppTab { feed, compete, home, ranking, rest }

// 첨부된 시안 스타일의 하단 바 — 가로선 위에 "피드 도전 · (포룸 원) · 랭킹 휴식"이 놓이고, 가운데 "포룸"은
// 선에 걸쳐 위로 솟아오른 큰 원이다.
class AppBottomBar extends StatelessWidget {
  const AppBottomBar({
    super.key,
    required this.selected,
    required this.onSelect,
  });

  final AppTab selected;
  final ValueChanged<AppTab> onSelect;

  static const double _barHeight = 60;
  static const double _circle = 74;
  // 원이 바 위로 솟아오르는 높이(원 지름의 절반).
  static const double _overhang = _circle / 2;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final bottomInset = MediaQuery.of(context).padding.bottom;
    final homeSelected = selected == AppTab.home;
    final circleColor = homeSelected ? kBrand : pal.lineStrong;

    return SizedBox(
      height: _barHeight + _overhang + bottomInset,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // 가로선이 있는 바 본체.
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: _barHeight + bottomInset,
            child: Container(
              padding: EdgeInsets.only(bottom: bottomInset),
              decoration: BoxDecoration(
                color: pal.bg,
                border: Border(
                  top: BorderSide(color: pal.lineStrong, width: 2),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        _TabLabel(
                          label: l10n.tabFeed,
                          selected: selected == AppTab.feed,
                          onTap: () => onSelect(AppTab.feed),
                        ),
                        _TabLabel(
                          label: l10n.tabCompete,
                          selected: selected == AppTab.compete,
                          onTap: () => onSelect(AppTab.compete),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: _circle + 8),
                  Expanded(
                    child: Row(
                      children: [
                        _TabLabel(
                          label: l10n.tabRanking,
                          selected: selected == AppTab.ranking,
                          onTap: () => onSelect(AppTab.ranking),
                        ),
                        _TabLabel(
                          label: l10n.tabRest,
                          selected: selected == AppTab.rest,
                          onTap: () => onSelect(AppTab.rest),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // 가운데 "포룸" 원 — 선(바 위쪽 경계)에 걸치도록 놓는다.
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Center(
              child: Semantics(
                button: true,
                selected: homeSelected,
                label: l10n.tabHome,
                child: GestureDetector(
                  onTap: () => onSelect(AppTab.home),
                  child: Container(
                    width: _circle,
                    height: _circle,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: pal.bg,
                      shape: BoxShape.circle,
                      border: Border.all(color: circleColor, width: 2.5),
                    ),
                    child: Text(
                      l10n.tabHome,
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: homeSelected ? kBrand : pal.subtext,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabLabel extends StatelessWidget {
  const _TabLabel({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return Expanded(
      child: Semantics(
        button: true,
        selected: selected,
        label: label,
        child: InkResponse(
          onTap: onTap,
          radius: 34,
          child: Center(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                maxLines: 1,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: selected ? kBrand : pal.muted,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
