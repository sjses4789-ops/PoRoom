import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/env.dart';
import '../../core/time_util.dart';
import '../feed/feed_models.dart';
import '../feed/feed_repository.dart';

class ChallengeProgress {
  const ChallengeProgress({
    required this.kind,
    required this.target,
    required this.todayChars,
  });

  final String kind; // daily1k | daily5k | daily10k
  final int target;
  final int todayChars;
}

// [홈]의 "나의 집필 생활" 요약 — 오늘의 목표/글자수/집중 시간, 연속 집필 일수, 참여 중인 반복 챌린지, 최근 피드.
class HomeDashboard {
  const HomeDashboard({
    required this.todayChars,
    required this.todayMinutes,
    required this.goalChars,
    required this.streak,
    required this.challenges,
    required this.feed,
  });

  final int todayChars;
  final int todayMinutes;
  final int goalChars; // 0이면 목표를 아직 안 정함
  final int streak;
  final List<ChallengeProgress> challenges;
  final List<FeedPostItem> feed;
}

const _dailyTargets = {'daily1k': 1000, 'daily5k': 5000, 'daily10k': 10000};

class HomeRepository {
  HomeRepository(this.selfId);

  final String selfId;

  SupabaseClient get _client => Supabase.instance.client;

  Future<HomeDashboard> fetchDashboard() async {
    if (Env.preview) return _preview();

    final today = todayKst();
    final base = DateTime.parse('${today}T00:00:00Z');
    final from = base.subtract(const Duration(days: 90));
    final fromKey = '${from.year}-${pad2(from.month)}-${pad2(from.day)}';

    // 한 조각이 실패해도 나머지는 보이도록 따로 불러온다.
    Future<T> safe<T>(Future<T> Function() run, T fallback) async {
      try {
        return await run();
      } catch (_) {
        return fallback;
      }
    }

    final results = await Future.wait([
      safe<List<Map<String, dynamic>>>(
        () async => List<Map<String, dynamic>>.from(
          await _client
              .from('daily_records')
              .select('record_date,chars,focus_minutes')
              .eq('user_id', selfId)
              .gte('record_date', fromKey),
        ),
        const [],
      ),
      safe<List<Map<String, dynamic>>>(
        () async => List<Map<String, dynamic>>.from(
          await _client
              .from('daily_char_goals')
              .select('target_chars')
              .eq('user_id', selfId)
              .lte('effective_date', today)
              .order('effective_date', ascending: false)
              .limit(1),
        ),
        const [],
      ),
      safe<List<ChallengeProgress>>(() => _joinedDailyChallenges(), const []),
      safe<List<FeedPostItem>>(
        () => FeedRepository(selfId).fetch(limit: 3),
        const [],
      ),
    ]);

    final records = results[0] as List<Map<String, dynamic>>;
    var todayChars = 0, todayMinutes = 0;
    final activeDays = <String>{};
    for (final r in records) {
      final date = r['record_date'] as String;
      final c = (r['chars'] as num?)?.toInt() ?? 0;
      final m = (r['focus_minutes'] as num?)?.toInt() ?? 0;
      if (c > 0 || m > 0) activeDays.add(date);
      if (date == today) {
        todayChars += c;
        todayMinutes += m;
      }
    }

    // 연속 집필 일수 — 오늘 기록이 없으면 어제부터 이어진 날을 센다. 출석 날짜는 웹과 같이 각자 시간대의 자정 기준으로
    // DB가 계산해 준다(my_attendance_dates, 0074). 그 함수가 없으면(0074 실행 전) 예전처럼 일별 기록으로 센다.
    String key(DateTime d) => '${d.year}-${pad2(d.month)}-${pad2(d.day)}';
    var attended = activeDays;
    var cursor = base;
    try {
      final profile = await _client
          .from('users')
          .select('timezone')
          .eq('id', selfId)
          .maybeSingle();
      final tz = (profile?['timezone'] as String?) ?? 'Asia/Seoul';
      final dates = await _client.rpc('my_attendance_dates', params: {'p_tz': tz});
      if (dates is List) {
        attended = {for (final d in dates) d.toString().substring(0, 10)};
        // 이 기기의 날짜가 곧 사용자의 "오늘"이다(기기는 사용자가 있는 나라의 시간을 쓴다).
        final now = DateTime.now();
        cursor = DateTime.utc(now.year, now.month, now.day);
      }
    } catch (_) {
      // 함수가 없거나 실패하면 일별 기록으로 계산한다.
    }
    var streak = 0;
    if (!attended.contains(key(cursor))) {
      cursor = cursor.subtract(const Duration(days: 1));
    }
    while (attended.contains(key(cursor))) {
      streak += 1;
      cursor = cursor.subtract(const Duration(days: 1));
    }

    final goals = results[1] as List<Map<String, dynamic>>;
    final goalChars = goals.isEmpty
        ? 0
        : (goals.first['target_chars'] as num?)?.toInt() ?? 0;
    final challenges = [
      for (final c in results[2] as List<ChallengeProgress>)
        ChallengeProgress(
          kind: c.kind,
          target: c.target,
          todayChars: todayChars,
        ),
    ];

    return HomeDashboard(
      todayChars: todayChars,
      todayMinutes: todayMinutes,
      goalChars: goalChars,
      streak: streak,
      challenges: challenges,
      feed: results[3] as List<FeedPostItem>,
    );
  }

  // 내가 참여 중인 반복 챌린지 중 "매일 N자" 종류(진행도를 글자수로 보여 줄 수 있는 것).
  Future<List<ChallengeProgress>> _joinedDailyChallenges() async {
    final mine = await _client
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', selfId);
    final ids = [for (final r in mine) r['challenge_id'] as String];
    if (ids.isEmpty) return const [];
    final rows = await _client
        .from('challenges')
        .select('kind')
        .inFilter('id', ids)
        .not('kind', 'is', null);
    final kinds = [for (final r in rows) r['kind'] as String];
    return [
      for (final k in ['daily1k', 'daily5k', 'daily10k'])
        if (kinds.contains(k))
          ChallengeProgress(kind: k, target: _dailyTargets[k]!, todayChars: 0),
    ];
  }
}

HomeDashboard _preview() {
  final now = DateTime.now();
  return HomeDashboard(
    todayChars: 3200,
    todayMinutes: 135,
    goalChars: 5000,
    streak: 7,
    challenges: const [
      ChallengeProgress(kind: 'daily5k', target: 5000, todayChars: 3200),
    ],
    feed: [
      FeedPostItem(
        id: 'f1',
        postType: 'write',
        authorId: 'u2',
        authorName: '하루',
        characterId: 'char_0007',
        mood: '조금씩이라도 매일 쓰니 분량이 쌓이네요. 오늘 목표 달성!',
        focusMinutes: 100,
        chars: 4200,
        meta: const {},
        createdAt: now.subtract(const Duration(minutes: 20)),
        reactions: const {
          'heart': FeedReaction(5, false),
          'clap': FeedReaction(0, false),
          'fire': FeedReaction(0, false),
        },
      ),
    ],
  );
}
