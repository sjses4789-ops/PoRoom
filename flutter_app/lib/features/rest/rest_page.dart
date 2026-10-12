import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/env.dart';
import '../../core/theme.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/common.dart';

class _RestPost {
  const _RestPost({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.authorName,
    required this.createdAt,
    required this.pinned,
    this.infoCategory,
  });

  final String id;
  final String title;
  final String content;
  final String category; // 자유 | 정보 | 인원 모집 (DB에 저장된 값)
  final String? infoCategory;
  final String authorName;
  final DateTime createdAt;
  final bool pinned;
}

// [휴식] 탭 — 작가 정보 게시판(정보·인원 모집·자유)과 쉬는 시간에 즐기는 게임. 게시판은 앱에서 읽고,
// 글쓰기와 게임은 웹에서 한다.
class RestPage extends StatefulWidget {
  const RestPage({super.key});

  @override
  State<RestPage> createState() => _RestPageState();
}

class _RestPageState extends State<RestPage> {
  Future<List<_RestPost>>? _future;
  String _tab = 'board';
  String _category = 'all';

  SupabaseClient get _client => Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  void _reload() {
    _future = _fetch();
    setState(() {});
  }

  Future<List<_RestPost>> _fetch() async {
    if (Env.preview) return _preview();
    final rows = await _client
        .from('rest_posts')
        .select(
          'id,user_id,title,content,created_at,category,info_category,pinned',
        )
        .order('pinned', ascending: false)
        .order('created_at', ascending: false)
        .limit(100);
    final ids = {for (final r in rows) r['user_id'] as String};
    final users = ids.isEmpty
        ? <Map<String, dynamic>>[]
        : List<Map<String, dynamic>>.from(
            await _client
                .from('users')
                .select('id,name')
                .inFilter('id', ids.toList()),
          );
    final names = {
      for (final u in users) u['id'] as String: (u['name'] as String?) ?? '',
    };
    return [
      for (final r in rows)
        _RestPost(
          id: r['id'] as String,
          title: r['title'] as String? ?? '',
          content: r['content'] as String? ?? '',
          category: r['category'] as String? ?? '자유',
          infoCategory: r['info_category'] as String?,
          authorName: names[r['user_id']] ?? '',
          createdAt: DateTime.parse(r['created_at'] as String),
          pinned: r['pinned'] as bool? ?? false,
        ),
    ];
  }

  String _categoryLabel(L10n l10n, String stored) => switch (stored) {
    '정보' => l10n.restCatInfo,
    '인원 모집' => l10n.restCatRecruit,
    _ => l10n.restCatFree,
  };

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return Column(
      children: [
        const SizedBox(height: 10),
        ChipRow<String>(
          items: [('board', l10n.restTabBoard), ('games', l10n.restTabGames)],
          selected: _tab,
          onSelected: (v) => setState(() => _tab = v),
        ),
        const SizedBox(height: 6),
        Expanded(
          child: _tab == 'games'
              ? _games(context)
              : Column(
                  children: [
                    ChipRow<String>(
                      items: [
                        ('all', l10n.feedCatAll),
                        ('정보', l10n.restCatInfo),
                        ('인원 모집', l10n.restCatRecruit),
                        ('자유', l10n.restCatFree),
                      ],
                      selected: _category,
                      onSelected: (v) => setState(() => _category = v),
                    ),
                    const SizedBox(height: 6),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: () async => _reload(),
                        child: AsyncBody<List<_RestPost>>(
                          future: _future,
                          onRetry: _reload,
                          builder: (context, posts) {
                            final visible = _category == 'all'
                                ? posts
                                : posts
                                      .where((p) => p.category == _category)
                                      .toList();
                            return ListView(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                              children: [
                                if (visible.isEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 40),
                                    child: Center(
                                      child: Text(
                                        l10n.feedEmpty,
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: pal.muted,
                                        ),
                                      ),
                                    ),
                                  ),
                                for (final p in visible)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 10),
                                    child: BorderedCard(
                                      onTap: () => _open(context, p),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              if (p.pinned)
                                                const Text(
                                                  '📌 ',
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 7,
                                                      vertical: 2,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: pal.surfaceAlt,
                                                  borderRadius:
                                                      BorderRadius.circular(99),
                                                  border: Border.all(
                                                    color: pal.line,
                                                  ),
                                                ),
                                                child: Text(
                                                  p.infoCategory != null &&
                                                          p.category == '정보'
                                                      ? p.infoCategory!
                                                      : _categoryLabel(
                                                          l10n,
                                                          p.category,
                                                        ),
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w700,
                                                    color: pal.subtext,
                                                  ),
                                                ),
                                              ),
                                              const Spacer(),
                                              Text(
                                                p.authorName,
                                                style: TextStyle(
                                                  fontSize: 11.5,
                                                  color: pal.muted,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            p.title,
                                            style: const TextStyle(
                                              fontSize: 14.5,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            stripHtml(p.content),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              fontSize: 12.5,
                                              height: 1.4,
                                              color: pal.subtext,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ],
    );
  }

  void _open(BuildContext context, _RestPost p) {
    final l10n = L10n.of(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.8,
        maxChildSize: 0.95,
        builder: (_, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
          children: [
            Text(
              p.title,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              '${p.authorName} · ${_categoryLabel(l10n, p.category)}',
              style: TextStyle(fontSize: 12, color: ctx.pal.muted),
            ),
            const SizedBox(height: 14),
            SelectableText(
              stripHtml(p.content),
              style: const TextStyle(fontSize: 14.5, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }

  Widget _games(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final games = [
      ('⌨️', l10n.restGameTyping),
      ('💣', l10n.restGameMinesweeper),
      ('🧱', l10n.restGameTetris),
      ('🔗', l10n.restGameWordChain),
      ('🔤', l10n.restGameChoseong),
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Text(
          l10n.restGamesHint,
          style: TextStyle(fontSize: 12, color: pal.muted),
        ),
        const SizedBox(height: 10),
        for (final (emoji, label) in games)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: BorderedCard(
              onTap: () => launchUrl(
                Uri.parse('${Env.webUrl}/rest'),
                mode: LaunchMode.externalApplication,
              ),
              child: Row(
                children: [
                  Text(emoji, style: const TextStyle(fontSize: 22)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Icon(Icons.open_in_new_rounded, size: 18, color: pal.muted),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

List<_RestPost> _preview() {
  final now = DateTime.now();
  return [
    _RestPost(
      id: 'r1',
      title: '웹소설 공모전 일정 정리 (10월)',
      content:
          '<p>이번 달 접수 마감되는 공모전 모음입니다.</p><p>1) 판타지 단편 공모전 2) 로맨스 장편 공모전</p>',
      category: '정보',
      infoCategory: '공모전',
      authorName: '하루',
      createdAt: now.subtract(const Duration(hours: 2)),
      pinned: true,
    ),
    _RestPost(
      id: 'r2',
      title: '같이 마감 달리실 분 모집해요',
      content: '<p>매일 밤 10시에 2시간씩 집중하는 방이에요. 편하게 오세요!</p>',
      category: '인원 모집',
      authorName: '달빛',
      createdAt: now.subtract(const Duration(days: 1)),
      pinned: false,
    ),
  ];
}
