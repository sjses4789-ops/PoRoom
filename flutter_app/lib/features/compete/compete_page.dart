import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_controller.dart';
import '../../core/env.dart';
import '../../core/theme.dart';
import '../../core/time_util.dart';
import '../../core/web_api.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/common.dart';
import '../../widgets/login_gate.dart';

class _Challenge {
  const _Challenge({
    required this.id,
    required this.title,
    required this.metric,
    required this.visibility,
    required this.isAdminEvent,
    required this.participants,
    required this.joined,
    this.kind,
    this.startDate,
    this.endDate,
    this.started = true,
  });

  final String id;
  final String title;
  final String metric;
  final String visibility;
  final String? kind; // daily1k | daily5k | daily10k | monthly_draft | null
  final bool isAdminEvent;
  final String? startDate;
  final String? endDate;
  final bool started;
  final int participants;
  final bool joined;

  bool get isSystem => kind != null || isAdminEvent;
  int? get dailyTarget => switch (kind) {
    'daily1k' => 1000,
    'daily5k' => 5000,
    'daily10k' => 10000,
    _ => null,
  };
}

class _CompeteData {
  const _CompeteData(this.duels, this.challenges, this.todayChars);

  final List<_Challenge> duels;
  final List<_Challenge> challenges;
  final int todayChars;
}

const _kindOrder = ['daily1k', 'daily5k', 'daily10k', 'monthly_draft'];

// [도전] 탭 — 1:1 대결과 반복 챌린지(매일 1천자/5천자/1만자, 매달 초단 완고) 목록. 참여/나가기는 웹과 같은 서버 로직으로
// 처리한다(참여하면 [개인] 할 일에도 자동으로 반영된다). 대결 만들기·초대코드 입장은 웹에서 한다.
class CompetePage extends StatefulWidget {
  const CompetePage({super.key});

  @override
  State<CompetePage> createState() => _CompetePageState();
}

class _CompetePageState extends State<CompetePage> {
  Future<_CompeteData>? _future;
  String _tab = 'challenge';
  String? _busyId;

  SupabaseClient get _client => Supabase.instance.client;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _fetch();
  }

  void _reload() {
    _future = _fetch();
    setState(() {});
  }

  Future<_CompeteData> _fetch() async {
    if (Env.preview) return _preview();
    final selfId = AuthScope.of(context).userId ?? '';

    final results = await Future.wait([
      _client
          .from('challenges')
          .select(
            'id,title,metric,visibility,kind,start_date,end_date,started_at,is_admin_event',
          )
          .filter('kind', 'is', null)
          .order('created_at', ascending: false)
          .limit(40),
      _client
          .from('challenges')
          .select(
            'id,title,metric,visibility,kind,start_date,end_date,started_at,is_admin_event',
          )
          .not('kind', 'is', null),
    ]);
    final rows = [...results[0], ...results[1]];
    final ids = [for (final r in rows) r['id'] as String];
    final participants = ids.isEmpty
        ? <Map<String, dynamic>>[]
        : List<Map<String, dynamic>>.from(
            await _client
                .from('challenge_participants')
                .select('challenge_id,user_id')
                .inFilter('challenge_id', ids),
          );
    final count = <String, int>{};
    final mine = <String>{};
    for (final p in participants) {
      final cid = p['challenge_id'] as String;
      count[cid] = (count[cid] ?? 0) + 1;
      if (p['user_id'] == selfId) mine.add(cid);
    }

    final today = todayKst();
    // 로그인 전에는 내 기록이 없다.
    final todayRows = selfId.isEmpty
        ? <Map<String, dynamic>>[]
        : List<Map<String, dynamic>>.from(
            await _client
                .from('daily_records')
                .select('chars')
                .eq('user_id', selfId)
                .eq('record_date', today),
          );
    final todayChars = todayRows.fold<int>(
      0,
      (sum, r) => sum + (r['chars'] as int? ?? 0),
    );

    _Challenge toItem(Map<String, dynamic> r) => _Challenge(
      id: r['id'] as String,
      title: r['title'] as String? ?? '',
      metric: r['metric'] as String? ?? 'chars',
      visibility: r['visibility'] as String? ?? 'open',
      kind: r['kind'] as String?,
      isAdminEvent: r['is_admin_event'] as bool? ?? false,
      startDate: r['start_date'] as String?,
      endDate: r['end_date'] as String?,
      started: r['kind'] != null || r['started_at'] != null,
      participants: count[r['id']] ?? 0,
      joined: mine.contains(r['id']),
    );

    final all = rows.map(toItem).toList();
    // 비공개 대결은 내가 참여 중인 것만 보인다(RLS가 이미 걸러 주지만, 참여 안 한 공개 대결과 구분해서 둔다).
    final duels = all.where((c) => !c.isSystem).toList();
    final challenges = all.where((c) => c.isSystem).toList()
      ..sort((a, b) {
        final ai = a.kind == null ? -1 : _kindOrder.indexOf(a.kind!);
        final bi = b.kind == null ? -1 : _kindOrder.indexOf(b.kind!);
        return ai.compareTo(bi);
      });
    return _CompeteData(duels, challenges, todayChars);
  }

  String _title(L10n l10n, _Challenge c) => switch (c.kind) {
    'daily1k' => l10n.challengeDaily1k,
    'daily5k' => l10n.challengeDaily5k,
    'daily10k' => l10n.challengeDaily10k,
    'monthly_draft' => l10n.challengeMonthlyDraft,
    _ => c.title,
  };

  Future<void> _toggle(_Challenge c) async {
    if (!await requireLogin(context)) return;
    if (!mounted) return;
    setState(() => _busyId = c.id);
    await WebApi.rpc<Object?>(c.joined ? 'leaveChallenge' : 'joinChallenge', [
      c.id,
    ]);
    if (!mounted) return;
    _busyId = null;
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return Column(
      children: [
        const SizedBox(height: 10),
        ChipRow<String>(
          items: [
            ('challenge', l10n.competeChallenges),
            ('duel', l10n.competeDuels),
          ],
          selected: _tab,
          onSelected: (v) => setState(() => _tab = v),
        ),
        const SizedBox(height: 6),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => _reload(),
            child: AsyncBody<_CompeteData>(
              future: _future,
              onRetry: _reload,
              builder: (context, data) {
                final list = _tab == 'duel' ? data.duels : data.challenges;
                final joined = list.where((c) => c.joined).toList();
                final open = list.where((c) => !c.joined).toList();
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  children: [
                    if (list.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 40),
                        child: Center(
                          child: Text(
                            l10n.competeEmpty,
                            style: TextStyle(fontSize: 13, color: pal.muted),
                          ),
                        ),
                      ),
                    if (joined.isNotEmpty) _heading(l10n.competeJoined),
                    for (final c in joined) _card(context, c, data),
                    if (open.isNotEmpty) _heading(l10n.competeOpen),
                    for (final c in open) _card(context, c, data),
                    if (_tab == 'duel')
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: OutlinedButton(
                          onPressed: () => launchUrl(
                            Uri.parse('${Env.webUrl}/compete'),
                            mode: LaunchMode.externalApplication,
                          ),
                          child: Text(l10n.competeCreateOnWeb),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _heading(String text) => Padding(
    padding: const EdgeInsets.fromLTRB(0, 10, 0, 8),
    child: Text(
      text,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
    ),
  );

  Widget _card(BuildContext context, _Challenge c, _CompeteData data) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final target = c.dailyTarget;
    final ended =
        c.endDate != null &&
        c.endDate!.compareTo(todayKst()) < 0 &&
        !c.isSystem;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: BorderedCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    _title(l10n, c),
                    style: const TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                if (c.joined)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: Text(
                      l10n.competeJoinedBadge,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF047857),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              [
                if (c.startDate != null && c.endDate != null)
                  '${c.startDate} ~ ${c.endDate}'
                else
                  l10n.competeNotStarted,
                l10n.competeParticipants(c.participants),
                if (ended) l10n.competeEnded,
              ].join(' · '),
              style: TextStyle(fontSize: 12, color: pal.muted),
            ),
            if (c.joined && target != null) ...[
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(99),
                child: LinearProgressIndicator(
                  value: (data.todayChars / target).clamp(0, 1).toDouble(),
                  minHeight: 8,
                  backgroundColor: pal.line,
                  color: data.todayChars >= target
                      ? const Color(0xFF10B981)
                      : pal.lineStrong,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                l10n.competeProgress(
                  formatNumber(data.todayChars),
                  formatNumber(target),
                ),
                style: TextStyle(fontSize: 11.5, color: pal.subtext),
              ),
            ],
            if (!ended &&
                c.started &&
                (c.isSystem || c.visibility == 'open' || c.joined)) ...[
              const SizedBox(height: 10),
              SizedBox(
                height: 34,
                child: c.joined
                    ? OutlinedButton(
                        onPressed: _busyId == null ? () => _toggle(c) : null,
                        child: Text(l10n.competeLeave),
                      )
                    : FilledButton(
                        onPressed: _busyId == null ? () => _toggle(c) : null,
                        child: Text(l10n.competeJoin),
                      ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

_CompeteData _preview() {
  final today = todayKst();
  return _CompeteData(
    const [
      _Challenge(
        id: 'd1',
        title: '주말 글자수 대결',
        metric: 'chars',
        visibility: 'open',
        isAdminEvent: false,
        startDate: '2026-10-10',
        endDate: '2026-10-12',
        participants: 3,
        joined: true,
      ),
    ],
    [
      const _Challenge(
        id: 'c1',
        title: '',
        metric: 'chars',
        visibility: 'open',
        kind: 'daily1k',
        isAdminEvent: false,
        participants: 18,
        joined: true,
      ),
      const _Challenge(
        id: 'c2',
        title: '',
        metric: 'chars',
        visibility: 'open',
        kind: 'daily5k',
        isAdminEvent: false,
        participants: 11,
        joined: false,
      ),
      const _Challenge(
        id: 'c3',
        title: '',
        metric: 'chars',
        visibility: 'open',
        kind: 'daily10k',
        isAdminEvent: false,
        participants: 4,
        joined: false,
      ),
      _Challenge(
        id: 'c4',
        title: '',
        metric: 'chars',
        visibility: 'open',
        kind: 'monthly_draft',
        isAdminEvent: false,
        startDate: '${today.substring(0, 7)}-01',
        endDate: '${today.substring(0, 7)}-30',
        participants: 9,
        joined: false,
      ),
    ],
    620,
  );
}
