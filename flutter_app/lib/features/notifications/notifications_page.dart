import 'package:flutter/material.dart';

import '../../core/env.dart';
import '../../core/theme.dart';
import '../../core/web_api.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/common.dart';

class AppNotification {
  const AppNotification({
    required this.id,
    required this.kind,
    required this.params,
    required this.read,
    required this.createdAt,
  });

  final String id;
  final String kind; // whisper | report_resolved | challenge_result | weekly_report
  final Map<String, dynamic> params;
  final bool read;
  final DateTime createdAt;

  AppNotification asRead() => AppNotification(
    id: id,
    kind: kind,
    params: params,
    read: true,
    createdAt: createdAt,
  );

  int _int(String key) => (params[key] as num?)?.toInt() ?? 0;

  /// 알림 한 줄 제목과(있으면) 보조 문구 — 웹의 벨(notifications-bell.tsx)과 같은 문구를 쓴다.
  ({String title, String? sub}) describe(L10n l10n) {
    switch (kind) {
      case 'whisper':
        final room = params['room'] as String?;
        return (
          title: l10n.notifWhisper((params['from'] as String?) ?? ''),
          sub: (room == null || room.isEmpty)
              ? null
              : l10n.notifWhisperRoom(room),
        );
      case 'report_resolved':
        return (
          title: params['isMessage'] == true
              ? l10n.notifReportResolvedMessage
              : l10n.notifReportResolved,
          sub: null,
        );
      case 'challenge_result':
        final title = (params['title'] as String?) ?? '';
        final metric = (params['metric'] as String?) ?? 'chars';
        final success = params['success'] == true;
        if (metric == 'achievement') {
          return (
            title: success
                ? l10n.notifAchievementDone(title)
                : l10n.notifAchievementMiss(title),
            sub: null,
          );
        }
        final n = _int('value').toString();
        final value = metric == 'minutes'
            ? l10n.notifUnitMinutes(n)
            : params['targetPosition'] == 'webtoon'
            ? l10n.notifUnitCuts(n)
            : l10n.notifUnitChars(n);
        final total = _int('total');
        final rank = _int('rank');
        if (params['type'] == 'duel') {
          return (
            title: success
                ? l10n.notifDuelWin(title, total, value)
                : l10n.notifDuelEnd(title, total, rank, value),
            sub: null,
          );
        }
        return (
          title: success
              ? l10n.notifEventDone(title, total, rank, value)
              : l10n.notifEventEnd(title, total, rank, value),
          sub: null,
        );
      case 'weekly_report':
        return (title: l10n.weeklyTitle, sub: weeklyBody(l10n));
    }
    return (title: kind, sub: null);
  }

  String weeklyBody(L10n l10n) => l10n.weeklyBody(
    _int('chars').toString(),
    _int('focusMinutes').toString(),
    _int('activeDays'),
    _int('streak'),
  );
}

// 웹의 서버 액션(getNotifications 등)을 그대로 부른다 — 웹과 같은 알림 목록이다.
Future<List<AppNotification>> fetchNotifications() async {
  if (Env.preview) return _preview();
  final json = await WebApi.rpc<Map<String, dynamic>>('getNotifications');
  if (json == null) throw Exception('notifications');
  return [
    for (final n in (json['items'] as List? ?? const []))
      () {
        final m = Map<String, dynamic>.from(n as Map);
        return AppNotification(
          id: m['id'] as String,
          kind: m['kind'] as String,
          params: Map<String, dynamic>.from((m['params'] as Map?) ?? const {}),
          read: m['read'] == true,
          createdAt: DateTime.parse(m['createdAt'] as String),
        );
      }(),
  ];
}

bool _synced = false;

// 앱을 켠 뒤 한 번 — 끝난 챌린지·대결 결과와 지난주 리포트를 알림으로 만든다(웹의 벨이 한 시간에 한 번 하는 것과 같다).
Future<void> syncNotificationsOnce() async {
  if (_synced || Env.preview) return;
  _synced = true;
  await WebApi.rpc<Object?>('syncMyNotifications');
}

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  Future<List<AppNotification>>? _future;
  List<AppNotification> _items = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = fetchNotifications().then((list) {
      _items = list;
      return list;
    });
    setState(() {});
  }

  Future<void> _open(AppNotification n) async {
    if (n.read) return;
    setState(
      () => _items = [for (final x in _items) x.id == n.id ? x.asRead() : x],
    );
    if (!Env.preview) WebApi.rpc<Object?>('markNotificationRead', [n.id]);
  }

  Future<void> _markAll() async {
    setState(() => _items = [for (final x in _items) x.asRead()]);
    if (!Env.preview) await WebApi.rpc<Object?>('markAllNotificationsRead');
  }

  Future<void> _delete(AppNotification n) async {
    setState(() => _items = _items.where((x) => x.id != n.id).toList());
    if (!Env.preview) await WebApi.rpc<Object?>('deleteNotification', [n.id]);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final hasUnread = _items.any((n) => !n.read);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notifTitle),
        actions: [
          if (hasUnread)
            TextButton(onPressed: _markAll, child: Text(l10n.notifMarkAll)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _load(),
        child: AsyncBody<List<AppNotification>>(
          future: _future,
          onRetry: _load,
          builder: (context, _) => _items.isEmpty
              ? ListView(
                  children: [
                    const SizedBox(height: 120),
                    Center(
                      child: Text(
                        l10n.notifEmpty,
                        style: TextStyle(fontSize: 13, color: pal.muted),
                      ),
                    ),
                  ],
                )
              : ListView.separated(
                  itemCount: _items.length,
                  separatorBuilder: (_, _) =>
                      Divider(height: 1, color: pal.line),
                  itemBuilder: (context, i) {
                    final n = _items[i];
                    final text = n.describe(l10n);
                    return Dismissible(
                      key: ValueKey(n.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        color: const Color(0xFFFEE2E2),
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        child: const Icon(
                          Icons.delete_outline,
                          color: Color(0xFFB91C1C),
                        ),
                      ),
                      onDismissed: (_) => _delete(n),
                      child: ListTile(
                        onTap: () => _open(n),
                        leading: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: n.read
                                ? Colors.transparent
                                : const Color(0xFFF87171),
                            shape: BoxShape.circle,
                          ),
                        ),
                        title: Text(
                          text.title,
                          style: TextStyle(
                            fontSize: 13.5,
                            height: 1.35,
                            fontWeight: n.read
                                ? FontWeight.w500
                                : FontWeight.w800,
                          ),
                        ),
                        subtitle: text.sub == null
                            ? null
                            : Text(
                                text.sub!,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  color: pal.subtext,
                                ),
                              ),
                        trailing: Text(
                          _stamp(n.createdAt),
                          style: TextStyle(fontSize: 11, color: pal.muted),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }

  String _stamp(DateTime d) {
    final l = d.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(l.month)}.${two(l.day)}';
  }
}

List<AppNotification> _preview() {
  final now = DateTime.now();
  return [
    AppNotification(
      id: 'p1',
      kind: 'weekly_report',
      params: const {
        'chars': 18400,
        'focusMinutes': 540,
        'activeDays': 6,
        'streak': 6,
      },
      read: false,
      createdAt: now.subtract(const Duration(hours: 3)),
    ),
    AppNotification(
      id: 'p2',
      kind: 'whisper',
      params: const {'from': '하루', 'room': '새벽 작업방'},
      read: false,
      createdAt: now.subtract(const Duration(hours: 5)),
    ),
    AppNotification(
      id: 'p3',
      kind: 'challenge_result',
      params: const {
        'type': 'duel',
        'title': '주말 글자수 대결',
        'metric': 'chars',
        'rank': 1,
        'total': 4,
        'value': 12300,
        'success': true,
      },
      read: true,
      createdAt: now.subtract(const Duration(days: 2)),
    ),
  ];
}
