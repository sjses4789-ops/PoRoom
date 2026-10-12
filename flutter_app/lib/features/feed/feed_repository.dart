import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/env.dart';
import '../../core/web_api.dart';
import 'feed_models.dart';

class FeedRepository {
  FeedRepository(this.selfId);

  final String selfId;

  SupabaseClient get _client => Supabase.instance.client;

  // 최근 글 100개 + 작성자 + 반응 — 웹 피드 페이지(feed/page.tsx)와 같은 조회(RLS 동일 적용).
  // 작성자/반응은 보여 줄 글에 해당하는 것만 가져온다(전체를 가져오면 조회 상한에 걸린다).
  Future<List<FeedPostItem>> fetch() async {
    if (Env.preview) return _preview();
    final posts = await _client
        .from('feed_posts')
        .select('id,user_id,post_type,mood,focus_minutes,chars,meta,created_at')
        .order('created_at', ascending: false)
        .limit(100);
    if (posts.isEmpty) return const [];

    final postIds = [for (final p in posts) p['id'] as String];
    final authorIds = {for (final p in posts) p['user_id'] as String};
    final users = await _client.from('users').select('id,name,character_id,position').inFilter('id', authorIds.toList());
    final reactions = await _client
        .from('feed_reactions')
        .select('post_id,user_id,reaction_type')
        .inFilter('post_id', postIds);

    final userById = {for (final u in users) u['id'] as String: u};
    final byPost = <String, List<Map<String, dynamic>>>{};
    for (final r in reactions) {
      byPost.putIfAbsent(r['post_id'] as String, () => []).add(r);
    }

    return [
      for (final p in posts)
        () {
          final u = userById[p['user_id']];
          final list = byPost[p['id']] ?? const <Map<String, dynamic>>[];
          return FeedPostItem(
            id: p['id'] as String,
            postType: p['post_type'] as String,
            authorId: p['user_id'] as String,
            authorName: (u?['name'] as String?) ?? '',
            characterId: u?['character_id'] as String?,
            authorPosition: u?['position'] == 'webtoon' ? 'webtoon' : 'novelist',
            mood: p['mood'] as String? ?? '',
            focusMinutes: p['focus_minutes'] as int? ?? 0,
            chars: p['chars'] as int? ?? 0,
            meta: Map<String, dynamic>.from((p['meta'] as Map?) ?? const {}),
            createdAt: DateTime.parse(p['created_at'] as String),
            reactions: {
              for (final type in reactionTypes)
                type: FeedReaction(
                  list.where((r) => r['reaction_type'] == type).length,
                  list.any((r) => r['reaction_type'] == type && r['user_id'] == selfId),
                ),
            },
          );
        }(),
    ];
  }

  // 웹의 서버 액션을 그대로 부른다(같은 검증·같은 규칙). 성공하면 true.
  Future<bool> createWritePost(String mood) async {
    if (Env.preview) return true;
    final result = await WebApi.rpc<Map<String, dynamic>>('createFeedPost', [
      {'postType': 'write', 'mood': mood},
      null,
    ]);
    return result != null && !result.containsKey('error');
  }

  Future<void> toggleReaction(String postId, String type) async {
    if (Env.preview) return;
    await WebApi.rpc<Object?>('toggleFeedReaction', [postId, type]);
  }

  Future<void> delete(String postId) async {
    if (Env.preview) return;
    await WebApi.rpc<Object?>('deleteFeedPost', [postId]);
  }
}

List<FeedPostItem> _preview() {
  final now = DateTime.now();
  FeedReaction r(int n, [bool on = false]) => FeedReaction(n, on);
  return [
    FeedPostItem(
      id: 'f1',
      postType: 'write',
      authorId: 'u2',
      authorName: '하루',
      characterId: 'char_0007',
      mood: '오늘은 3화 초고를 끝냈어요. 손이 풀리니 술술 써지네요!',
      focusMinutes: 125,
      chars: 5120,
      meta: const {},
      createdAt: now.subtract(const Duration(minutes: 20)),
      reactions: {'heart': r(5, true), 'clap': r(2), 'fire': r(1)},
    ),
    FeedPostItem(
      id: 'f2',
      postType: 'challenge',
      authorId: 'u3',
      authorName: '달빛',
      characterId: 'char_0012',
      mood: '매일 5천자 챌린지 성공 🎉',
      focusMinutes: 0,
      chars: 5230,
      meta: const {'challengeTitle': '매일 5천자 쓰기 챌린지', 'achieved': true},
      createdAt: now.subtract(const Duration(hours: 3)),
      reactions: {'heart': r(8), 'clap': r(4), 'fire': r(3)},
    ),
    FeedPostItem(
      id: 'f3',
      postType: 'duel',
      authorId: 'u4',
      authorName: '글쓰는곰',
      characterId: 'char_0020',
      mood: '이번 대결은 아쉽게 졌네요… 다음엔 이긴다!',
      focusMinutes: 0,
      chars: 0,
      meta: const {'challengeTitle': '주말 글자수 대결', 'result': 'loss', 'rank': 2, 'participantCount': 3},
      createdAt: now.subtract(const Duration(days: 1)),
      reactions: {'heart': r(1), 'clap': r(0), 'fire': r(0)},
    ),
  ];
}
