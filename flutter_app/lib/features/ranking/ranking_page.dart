import 'package:flutter/material.dart';

import '../../core/env.dart';
import '../../core/theme.dart';
import '../../core/time_util.dart';
import '../../core/web_api.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/common.dart';

class _RankRow {
  const _RankRow(
    this.rank,
    this.name,
    this.value, {
    this.sub,
    this.isSelf = false,
  });

  final int rank;
  final String name;
  final String value;
  final String? sub;
  final bool isSelf;
}

class _RankingData {
  const _RankingData({
    required this.overall,
    required this.typing,
    required this.challenge,
    required this.position,
    required this.today,
    this.me,
    this.selfId,
  });

  final List<Map<String, dynamic>> overall;
  final List<Map<String, dynamic>> typing;
  final List<Map<String, dynamic>> challenge;
  final String position;
  final String today;
  final Map<String, dynamic>? me;
  final String? selfId;
}

// [랭킹] 탭 — 글자수(방/개인 × 일/월/연) · 챌린지 점수 · 타자 속도. 웹과 같은 규칙으로 서버(/api/app/ranking)가
// 집계해 돌려준 값을 그대로 보여 준다.
class RankingPage extends StatefulWidget {
  const RankingPage({super.key});

  @override
  State<RankingPage> createState() => _RankingPageState();
}

class _RankingPageState extends State<RankingPage> {
  Future<_RankingData>? _future;
  String _tab = 'chars'; // chars | challenge | typing
  String _scope = 'user'; // user | room
  String _period = 'month'; // day | month | year
  String _date = todayKst();
  String? _position; // null이면 내 직업

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = _fetch();
    setState(() {});
  }

  Future<_RankingData> _fetch() async {
    if (Env.preview) return _previewData();
    final json = await WebApi.getJson('ranking', {
      'scope': _scope,
      'period': _period,
      'date': _date,
      'position': ?_position,
    });
    if (json == null) throw Exception('ranking');
    List<Map<String, dynamic>> list(String k) => [
      for (final e in (json[k] as List? ?? const []))
        Map<String, dynamic>.from(e as Map),
    ];
    return _RankingData(
      overall: list('overall'),
      typing: list('typing'),
      challenge: list('challenge'),
      position: json['position'] as String? ?? 'novelist',
      today: json['today'] as String? ?? todayKst(),
      me: json['me'] == null
          ? null
          : Map<String, dynamic>.from(json['me'] as Map),
      selfId: json['selfId'] as String?,
    );
  }

  // 기준 날짜를 기간 단위만큼 옮긴다(오늘을 넘어가지 않는다 — 웹과 같은 규칙).
  void _shift(int dir, String today) {
    final p = _date.split('-').map(int.parse).toList();
    DateTime next;
    switch (_period) {
      case 'day':
        next = DateTime(p[0], p[1], p[2] + dir);
      case 'month':
        final dim = DateTime(p[0], p[1] + dir + 1, 0).day;
        next = DateTime(p[0], p[1] + dir, p[2] < dim ? p[2] : dim);
      default:
        final dim = DateTime(p[0] + dir, p[1] + 1, 0).day;
        next = DateTime(p[0] + dir, p[1], p[2] < dim ? p[2] : dim);
    }
    final iso = '${next.year}-${pad2(next.month)}-${pad2(next.day)}';
    _date = iso.compareTo(today) > 0 ? today : iso;
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    return Column(
      children: [
        const SizedBox(height: 10),
        ChipRow<String>(
          items: [
            ('chars', l10n.rankTabChars),
            ('challenge', l10n.rankTabChallenge),
            ('typing', l10n.rankTabTyping),
          ],
          selected: _tab,
          onSelected: (v) => setState(() => _tab = v),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => _load(),
            child: AsyncBody<_RankingData>(
              future: _future,
              onRetry: _load,
              builder: (context, data) => _body(context, data),
            ),
          ),
        ),
      ],
    );
  }

  Widget _body(BuildContext context, _RankingData data) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final unit = data.position == 'webtoon' ? l10n.cutUnit : l10n.charUnit;

    final rows = switch (_tab) {
      'challenge' => [
        for (final r in data.challenge)
          _RankRow(
            r['rank'] as int,
            r['name'] as String,
            l10n.rankScoreValue(_num(r['score'])),
            isSelf: r['key'] == data.selfId,
          ),
      ],
      'typing' => [
        for (final r in data.typing)
          _RankRow(
            r['rank'] as int,
            r['name'] as String,
            l10n.rankCpmValue((r['cpm'] as num).round()),
            isSelf: r['key'] == data.selfId,
          ),
      ],
      _ => [
        for (final r in data.overall)
          _RankRow(
            r['rank'] as int,
            r['name'] as String,
            '${formatNumber((r['chars'] as num).toInt())}$unit',
            sub:
                '${formatNumber((r['minutes'] as num).toInt())}${l10n.minuteUnit}',
            isSelf: _scope == 'user' && r['key'] == data.selfId,
          ),
      ],
    };

    final dateParts = _date.split('-').map(int.parse).toList();
    final dateLabel = switch (_period) {
      'day' => l10n.rankDateDay(dateParts[1], dateParts[2]),
      'month' => l10n.rankDateMonth(dateParts[0], dateParts[1]),
      _ => l10n.rankDateYear(dateParts[0]),
    };
    final refLen = _period == 'day'
        ? 10
        : _period == 'month'
        ? 7
        : 4;
    final atLatest =
        _date.substring(0, refLen).compareTo(data.today.substring(0, refLen)) >=
        0;

    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
          children: [
            // 직업 전환 — 같은 기록 칸이 직업마다 다른 단위(글자수/컷수)라서 한 번에 한 직업만 보여 준다.
            Row(
              children: [
                _MiniToggle(
                  items: [
                    ('novelist', l10n.positionNovelist),
                    ('webtoon', l10n.positionWebtoon),
                  ],
                  selected: data.position,
                  onSelected: (v) {
                    _position = v;
                    _load();
                  },
                ),
              ],
            ),
            if (_tab == 'chars') ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  _MiniToggle(
                    items: [
                      ('user', l10n.rankScopeUser),
                      ('room', l10n.rankScopeRoom),
                    ],
                    selected: _scope,
                    onSelected: (v) {
                      _scope = v;
                      _load();
                    },
                  ),
                  const SizedBox(width: 10),
                  _MiniToggle(
                    items: [
                      ('day', l10n.rankPeriodDay),
                      ('month', l10n.rankPeriodMonth),
                      ('year', l10n.rankPeriodYear),
                    ],
                    selected: _period,
                    onSelected: (v) {
                      _period = v;
                      _load();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: () => _shift(-1, data.today),
                    icon: const Icon(Icons.chevron_left_rounded),
                  ),
                  Text(
                    dateLabel,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  IconButton(
                    onPressed: atLatest ? null : () => _shift(1, data.today),
                    icon: const Icon(Icons.chevron_right_rounded),
                  ),
                ],
              ),
            ],
            if (_tab == 'challenge')
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  l10n.rankChallengeHint,
                  style: TextStyle(fontSize: 11.5, color: pal.muted),
                ),
              ),
            const SizedBox(height: 6),
            if (rows.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Center(
                  child: Text(
                    l10n.rankEmpty,
                    style: TextStyle(fontSize: 13, color: pal.muted),
                  ),
                ),
              ),
            for (final r in rows) _RankTile(row: r),
          ],
        ),
        if (_tab == 'chars' && data.me != null)
          Positioned(
            left: 16,
            right: 16,
            bottom: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: pal.lineStrong,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                l10n.rankMyRank(
                  data.me!['rank'] as int,
                  data.me!['total'] as int,
                  '${formatNumber((data.me!['chars'] as num).toInt())}$unit',
                ),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: pal.bg,
                ),
              ),
            ),
          ),
      ],
    );
  }

  static String _num(Object? v) {
    final d = (v as num).toDouble();
    return d == d.roundToDouble() ? d.toInt().toString() : d.toStringAsFixed(1);
  }
}

class _MiniToggle extends StatelessWidget {
  const _MiniToggle({
    required this.items,
    required this.selected,
    required this.onSelected,
  });

  final List<(String, String)> items;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: pal.line),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final (value, label) in items)
            InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () => onSelected(value),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: value == selected
                      ? pal.lineStrong
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: value == selected ? pal.bg : pal.subtext,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _RankTile extends StatelessWidget {
  const _RankTile({required this.row});

  final _RankRow row;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final medal = switch (row.rank) {
      1 => '🥇',
      2 => '🥈',
      3 => '🥉',
      _ => null,
    };
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: row.isSelf ? pal.surfaceAlt : Colors.transparent,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: row.isSelf ? pal.lineStrong : pal.line),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 34,
            child: medal != null
                ? Text(medal, style: const TextStyle(fontSize: 18))
                : Text(
                    '${row.rank}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: pal.muted,
                    ),
                  ),
          ),
          Expanded(
            child: Text(
              row.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                row.value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (row.sub != null)
                Text(
                  row.sub!,
                  style: TextStyle(fontSize: 11, color: pal.muted),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

_RankingData _previewData() {
  final names = ['하루', '달빛', '글쓰는곰', '새벽', '미리보기', '구름', '바람'];
  return _RankingData(
    overall: [
      for (var i = 0; i < names.length; i++)
        {
          'rank': i + 1,
          'key': 'u$i',
          'name': names[i],
          'chars': 52000 - i * 6200,
          'minutes': 1800 - i * 200,
        },
    ],
    typing: [
      for (var i = 0; i < 5; i++)
        {'rank': i + 1, 'key': 'u$i', 'name': names[i], 'cpm': 540 - i * 40},
    ],
    challenge: [
      for (var i = 0; i < 5; i++)
        {'rank': i + 1, 'key': 'u$i', 'name': names[i], 'score': 24 - i * 4},
    ],
    position: 'novelist',
    today: todayKst(),
    me: {'rank': 5, 'chars': 27200, 'total': 38},
    selfId: 'u4',
  );
}
