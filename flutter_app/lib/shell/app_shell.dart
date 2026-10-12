import 'package:flutter/material.dart';

import '../features/compete/compete_page.dart';
import '../features/feed/feed_page.dart';
import '../features/ranking/ranking_page.dart';
import '../features/rest/rest_page.dart';
import '../features/rooms/rooms_page.dart';
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
