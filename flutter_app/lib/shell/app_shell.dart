import 'package:flutter/material.dart';

import '../features/compete/compete_page.dart';
import '../features/feed/feed_page.dart';
import '../features/ranking/ranking_page.dart';
import '../features/rest/rest_page.dart';
import '../features/rooms/rooms_page.dart';
import '../core/auth_controller.dart';
import '../core/theme.dart';
import '../l10n/app_localizations.dart';
import '../widgets/login_gate.dart';
import 'bottom_bar.dart';
import 'top_bar.dart';

// 로그인 뒤의 기본 화면 — 상단 바 + 다섯 탭(피드·도전·포룸·랭킹·휴식) + 시안 스타일 하단 바.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  AppTab _tab = AppTab.home;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const AppTopBar(),
            if (AuthScope.of(context).isGuest) const _GuestBanner(),
            Expanded(
              // 탭을 오가도 각 화면의 스크롤 위치와 상태가 유지되도록 IndexedStack을 쓴다.
              child: IndexedStack(
                index: _tab.index,
                children: const [
                  FeedPage(),
                  CompetePage(),
                  RoomsPage(),
                  RankingPage(),
                  RestPage(),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: AppBottomBar(
        selected: _tab,
        onSelect: (tab) => setState(() => _tab = tab),
      ),
    );
  }
}

// 로그인 전(보기 전용)임을 알리는 얇은 띠 — 누르면 로그인 화면으로 간다.
class _GuestBanner extends StatelessWidget {
  const _GuestBanner();

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return InkWell(
      onTap: () => openLogin(context),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        color: pal.surfaceAlt,
        child: Text(
          L10n.of(context).guestViewerBanner,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: pal.subtext),
        ),
      ),
    );
  }
}
