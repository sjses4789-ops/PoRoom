import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_controller.dart';
import '../../core/env.dart';
import '../../core/theme.dart';
import '../../core/time_util.dart';
import '../../core/web_api.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/character_avatar.dart';
import '../../widgets/common.dart';

class _Todo {
  const _Todo(this.id, this.content);

  final String id;
  final String content;
}

class _MeData {
  const _MeData({
    required this.todayChars,
    required this.todayMinutes,
    required this.monthChars,
    required this.todos,
  });

  final int todayChars;
  final int todayMinutes;
  final int monthChars;
  final List<_Todo> todos;
}

// [개인] 화면 — 내 프로필, 오늘/이번 달 기록, 할 일. 글자수 통계·목표·작품·뽀모도로 통계 같은 자세한 화면은 웹에서 연다.
class MePage extends StatefulWidget {
  const MePage({super.key});

  @override
  State<MePage> createState() => _MePageState();
}

class _MePageState extends State<MePage> {
  Future<_MeData>? _future;
  List<_Todo> _todos = const [];
  final _todoController = TextEditingController();

  SupabaseClient get _client => Supabase.instance.client;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _fetch();
  }

  @override
  void dispose() {
    _todoController.dispose();
    super.dispose();
  }

  void _reload() {
    _future = _fetch();
    setState(() {});
  }

  Future<_MeData> _fetch() async {
    if (Env.preview) {
      _todos = const [_Todo('t1', '(챌린지) 1천자 쓰기'), _Todo('t2', '3화 퇴고하기')];
      return _MeData(
        todayChars: 3420,
        todayMinutes: 125,
        monthChars: 84200,
        todos: _todos,
      );
    }
    final selfId = AuthScope.of(context).userId ?? '';
    final today = todayKst();
    final monthStart = '${today.substring(0, 7)}-01';
    final records = await _client
        .from('daily_records')
        .select('record_date,chars,focus_minutes')
        .eq('user_id', selfId)
        .gte('record_date', monthStart);
    var todayChars = 0, todayMinutes = 0, monthChars = 0;
    for (final r in records) {
      final c = r['chars'] as int? ?? 0;
      monthChars += c;
      if (r['record_date'] == today) {
        todayChars += c;
        todayMinutes += r['focus_minutes'] as int? ?? 0;
      }
    }
    final todoRows = await _client
        .from('todos')
        .select('id,content,for_date')
        .eq('user_id', selfId)
        .filter('completed_at', 'is', null)
        .order('created_at', ascending: true);
    // 챌린지가 자동으로 넣은 할 일은 기간(오늘/이번 달)이 지나면 목록에서 숨긴다(웹과 같다).
    final todos = [
      for (final t in todoRows)
        if (t['for_date'] == null ||
            ((t['content'] as String?)?.contains('초단') == true
                ? (t['for_date'] as String).compareTo(monthStart) >= 0
                : (t['for_date'] as String).compareTo(today) >= 0))
          _Todo(t['id'] as String, t['content'] as String),
    ];
    _todos = todos;
    return _MeData(
      todayChars: todayChars,
      todayMinutes: todayMinutes,
      monthChars: monthChars,
      todos: todos,
    );
  }

  Future<void> _addTodo() async {
    final text = _todoController.text.trim();
    if (text.isEmpty) return;
    _todoController.clear();
    if (Env.preview) {
      setState(
        () => _todos = [..._todos, _Todo('t${_todos.length + 9}', text)],
      );
      return;
    }
    final result = await WebApi.rpc<Map<String, dynamic>>('createTodo', [text]);
    if (result != null && result['id'] is String) {
      setState(
        () => _todos = [
          ..._todos,
          _Todo(result['id'] as String, result['content'] as String? ?? text),
        ],
      );
    }
  }

  Future<void> _complete(_Todo t) async {
    setState(() => _todos = _todos.where((x) => x.id != t.id).toList());
    if (!Env.preview)
      await WebApi.rpc<Object?>('setTodoCompleted', [t.id, true]);
  }

  Future<void> _remove(_Todo t) async {
    setState(() => _todos = _todos.where((x) => x.id != t.id).toList());
    if (!Env.preview) await WebApi.rpc<Object?>('deleteTodo', [t.id]);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final auth = AuthScope.of(context);
    final profile = auth.profile;
    final unit = profile?.position == 'webtoon' ? l10n.cutUnit : l10n.charUnit;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.myPage),
        actions: [
          TextButton(
            onPressed: () async {
              await auth.signOut();
              if (context.mounted)
                Navigator.of(context).popUntil((r) => r.isFirst);
            },
            child: Text(l10n.signOut),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: AsyncBody<_MeData>(
          future: _future,
          onRetry: _reload,
          builder: (context, data) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            children: [
              BorderedCard(
                child: Row(
                  children: [
                    CharacterAvatar(
                      characterId: profile?.characterId,
                      size: 56,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profile?.name ?? '',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            profile?.position == 'webtoon'
                                ? l10n.positionWebtoon
                                : l10n.positionNovelist,
                            style: TextStyle(fontSize: 12.5, color: pal.muted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _StatBox(
                      label: l10n.meToday,
                      value: '${formatNumber(data.todayChars)}$unit',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatBox(
                      label: l10n.pomodoroFocusLabel,
                      value:
                          '${formatNumber(data.todayMinutes)}${l10n.minuteUnit}',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _StatBox(
                      label: l10n.meMonth,
                      value: '${formatNumber(data.monthChars)}$unit',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                l10n.meTodos,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _todoController,
                      onSubmitted: (_) => _addTodo(),
                      decoration: InputDecoration(
                        hintText: l10n.meTodoHint,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: pal.line),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: pal.line),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _addTodo,
                    style: FilledButton.styleFrom(
                      backgroundColor: pal.lineStrong,
                      foregroundColor: pal.bg,
                    ),
                    child: Text(l10n.recordAdd),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              if (_todos.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Text(
                    l10n.meNoTodos,
                    style: TextStyle(fontSize: 12.5, color: pal.muted),
                  ),
                ),
              for (final t in _todos)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  leading: Checkbox(
                    value: false,
                    onChanged: (_) => _complete(t),
                  ),
                  title: Text(t.content, style: const TextStyle(fontSize: 14)),
                  trailing: IconButton(
                    onPressed: () => _remove(t),
                    icon: Icon(Icons.close_rounded, size: 18, color: pal.muted),
                  ),
                ),
              const SizedBox(height: 18),
              OutlinedButton.icon(
                onPressed: () => launchUrl(
                  Uri.parse('${Env.webUrl}/me'),
                  mode: LaunchMode.externalApplication,
                ),
                icon: const Icon(Icons.open_in_new_rounded, size: 18),
                label: Text(l10n.meOpenWeb),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return BorderedCard(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Column(
        children: [
          Text(label, style: TextStyle(fontSize: 11.5, color: pal.muted)),
          const SizedBox(height: 4),
          FittedBox(
            child: Text(
              value,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}
