import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_controller.dart';
import '../../core/env.dart';
import '../../core/pomodoro_controller.dart';
import '../../core/theme.dart';
import '../../core/time_util.dart';
import '../../core/web_api.dart';
import '../../l10n/app_localizations.dart';
import 'room_chat.dart';
import 'room_data.dart';
import 'room_models.dart';
import 'room_presence.dart';
import 'widgets/char_input_card.dart';
import 'widgets/chat_view.dart';
import 'widgets/participant_card.dart';
import 'widgets/pomodoro_card.dart';
import 'widgets/session_guard.dart';

enum _RoomTab { members, chat, record }

// 방 화면 — 웹의 room/[id]를 앱 화면으로 옮긴 것. 참여자 카드·뽀모도로·채팅·글자수 기록은 앱 화면이고,
// 웹과 같은 실시간 채널을 써서 웹 사용자와 앱 사용자가 한 방에서 서로 보인다. 일정·투표·게시판·기록 그래프처럼
// 아직 앱 화면이 없는 부분은 "더보기"에서 웹 화면으로 연다.
class RoomPage extends StatefulWidget {
  const RoomPage({super.key, required this.room});

  final RoomSummary room;

  @override
  State<RoomPage> createState() => _RoomPageState();
}

class _RoomPageState extends State<RoomPage> {
  RoomDataController? _data;
  RoomPresenceController? _presence;
  RoomChatController? _chat;
  PomodoroController? _pomo;
  _RoomTab _tab = _RoomTab.members;
  int _unread = 0;
  int _addedToday = 0;
  Timer? _heartbeat;
  Timer? _pomoPush;
  bool _wasTakenOver = false;

  String get _roomId => widget.room.id;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_data != null) return;
    final auth = AuthScope.of(context);
    final selfId = auth.userId ?? '';
    final selfName = auth.profile?.name ?? '';
    final pomo = PomodoroScope.of(context);

    _pomo = pomo;
    _data = RoomDataController(roomId: _roomId, selfId: selfId);
    _presence = RoomPresenceController(
      roomId: _roomId,
      selfId: selfId,
      selfName: selfName,
    )..addListener(_onPresence);
    _chat = RoomChatController(
      roomId: _roomId,
      selfId: selfId,
      onIncoming: () {
        if (_tab != _RoomTab.chat && mounted) setState(() => _unread += 1);
      },
    );
    pomo.addListener(_pushPomodoro);
    _pushPomodoro();
    _pomoPush = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _pushPomodoro(),
    );
    if (!Env.preview) {
      // 접속 시각 갱신(웹의 touchLastSeen heartbeat와 같다).
      WebApi.rpc<Object?>('touchLastSeen', [_roomId]);
      _heartbeat = Timer.periodic(
        const Duration(seconds: 30),
        (_) => WebApi.rpc<Object?>('touchLastSeen', [_roomId]),
      );
    }
  }

  // 내 뽀모도로 상태를 다른 참여자 카드에도 보이도록 접속 채널로 알린다(웹과 같은 payload).
  void _pushPomodoro() {
    final pomo = _pomo;
    final presence = _presence;
    if (pomo == null || presence == null) return;
    final active = pomo.isActiveRoom(_roomId);
    presence.setPomodoroState(
      active ? pomo.phase : PomodoroPhase.idle,
      active ? pomo.elapsedFraction : 0,
      active && pomo.running,
      pomo.phaseDurationSeconds,
    );
  }

  // 다른 기기에서 이 방을 이어받으면 이 화면의 뽀모도로를 멈춰, 두 곳에서 같은 시간이 겹쳐 기록되는 것을 막는다.
  void _onPresence() {
    final presence = _presence;
    final pomo = _pomo;
    if (presence != null &&
        pomo != null &&
        presence.takenOver &&
        !_wasTakenOver) {
      _wasTakenOver = true;
      if (pomo.isActiveRoom(_roomId) && pomo.running) pomo.pause();
    }
  }

  @override
  void dispose() {
    _heartbeat?.cancel();
    _pomoPush?.cancel();
    _pomo?.removeListener(_pushPomodoro);
    _presence?.removeListener(_onPresence);
    _data?.dispose();
    _presence?.dispose();
    _chat?.dispose();
    super.dispose();
  }

  Future<void> _confirmLeave() async {
    final l10n = L10n.of(context);
    final navigator = Navigator.of(context);
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.roomLeave),
        content: Text(l10n.roomLeaveConfirmBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.roomLeave),
          ),
        ],
      ),
    );
    if (yes != true) return;
    final pomo = _pomo;
    if (pomo != null && pomo.isActiveRoom(_roomId)) pomo.reset();
    await WebApi.rpc<Object?>('leaveRoom', [_roomId]);
    navigator.pop();
  }

  void _openMenu() {
    final l10n = L10n.of(context);
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.open_in_new_rounded),
              title: Text(l10n.roomMenuWeb),
              onTap: () {
                Navigator.pop(ctx);
                launchUrl(
                  Uri.parse('${Env.webUrl}/room/$_roomId'),
                  mode: LaunchMode.externalApplication,
                );
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.logout_rounded,
                color: Color(0xFFB91C1C),
              ),
              title: Text(
                l10n.roomLeave,
                style: const TextStyle(color: Color(0xFFB91C1C)),
              ),
              onTap: () {
                Navigator.pop(ctx);
                _confirmLeave();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final data = _data!;
    final presence = _presence!;
    final pomo = _pomo!;
    final selfId = AuthScope.of(context).userId ?? '';

    return ListenableBuilder(
      listenable: Listenable.merge([data, presence, pomo]),
      builder: (context, _) {
        final room = data.room;
        final selfMember = data.self;

        Widget body;
        if (data.loading) {
          body = const Center(child: CircularProgressIndicator());
        } else if (data.notFound || room == null) {
          body = Center(
            child: Text(
              l10n.roomNotFound,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          );
        } else if (selfMember == null) {
          body = _NotJoined(room: room, onJoined: data.load);
        } else {
          body = _buildRoom(context, room, selfMember, selfId);
        }

        final active =
            room != null && pomo.isActiveRoom(room.id) && pomo.started;
        return Scaffold(
          appBar: AppBar(
            title: Text(
              room?.name ?? widget.room.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            actions: [
              if (active)
                Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Center(
                    child: Text(
                      formatClock(pomo.remainingSeconds),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: pomo.phase == PomodoroPhase.rest
                            ? kBreakBlue
                            : kBrand,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                  ),
                ),
              IconButton(
                onPressed: _openMenu,
                tooltip: l10n.roomLeave,
                icon: const Icon(Icons.more_horiz_rounded),
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Divider(height: 1, color: pal.line),
            ),
          ),
          body: Stack(
            children: [
              body,
              if (presence.duplicateSession || presence.takenOver)
                SessionGuard(
                  takenOver: presence.takenOver,
                  onContinue: presence.claimSession,
                  onLeave: () => Navigator.of(context).pop(),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRoom(
    BuildContext context,
    RoomInfo room,
    RoomMember selfMember,
    String selfId,
  ) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final data = _data!;
    final presence = _presence!;
    final pomo = _pomo!;
    final canModerate = selfMember.isOwner || selfMember.isVice;
    final isActive = pomo.isActiveRoom(room.id);

    final participants = <ParticipantData>[
      for (final m in data.members)
        () {
          final isSelf = m.id == selfId;
          final p = isSelf
              ? PomodoroView(
                  isActive ? pomo.phase : PomodoroPhase.idle,
                  isActive ? pomo.elapsedFraction : 0,
                )
              : presence.pomodoroOf(m.id);
          final status = isSelf
              ? (presence.statusOf(m.id) == PresenceStatus.typing
                    ? PresenceStatus.typing
                    : PresenceStatus.idle)
              : presence.statusOf(m.id);
          return ParticipantData(
            id: m.id,
            name: m.name.isEmpty ? l10n.unknownUser : m.name,
            isSelf: isSelf,
            characterId: m.characterId,
            phase: p.phase,
            elapsedFraction: p.elapsedFraction,
            presence: status,
            recordsVisible: m.recordsVisible,
            todayChars: m.todayChars + (isSelf ? _addedToday : 0),
            position: m.position,
            workStatus: m.workStatus,
            isOwner: m.isOwner,
            isVice: m.isVice,
            lastSeenAt: m.lastSeenAt,
          );
        }(),
    ];
    // "나"는 항상 맨 앞, 나머지는 접속 중인 사람이 먼저, 그다음 이름순(웹과 같다).
    final others = participants.where((p) => !p.isSelf).toList()
      ..sort((a, b) {
        final byPresence =
            (a.presence == PresenceStatus.offline ? 1 : 0) -
            (b.presence == PresenceStatus.offline ? 1 : 0);
        return byPresence != 0 ? byPresence : a.name.compareTo(b.name);
      });
    final ordered = [...participants.where((p) => p.isSelf), ...others];
    final online = ordered
        .where((p) => p.presence != PresenceStatus.offline)
        .length;

    final tabs = [
      (_RoomTab.members, l10n.roomTabMembers, 0),
      (_RoomTab.chat, l10n.roomTabChat, _unread),
      (_RoomTab.record, l10n.roomTabRecord, 0),
    ];

    return Column(
      children: [
        Row(
          children: [
            for (final (tab, label, badge) in tabs)
              Expanded(
                child: InkWell(
                  onTap: () => setState(() {
                    _tab = tab;
                    if (tab == _RoomTab.chat) _unread = 0;
                  }),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: _tab == tab
                              ? pal.lineStrong
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        badge > 0
                            ? '$label  ${badge > 99 ? '99+' : badge}'
                            : label,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: _tab == tab ? pal.text : pal.muted,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
        Divider(height: 1, color: pal.line),
        Expanded(
          child: IndexedStack(
            index: _tab.index,
            children: [
              ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  PomodoroCard(room: room),
                  const SizedBox(height: 12),
                  Text(
                    room.capacity != null
                        ? l10n.participantsLineCap(
                            data.members.length,
                            room.capacity!,
                            online,
                          )
                        : l10n.participantsLine(data.members.length, online),
                    style: TextStyle(fontSize: 12, color: pal.subtext),
                  ),
                  const SizedBox(height: 8),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 0.98,
                    children: [
                      for (final p in ordered) ParticipantCard(data: p),
                    ],
                  ),
                ],
              ),
              ChatView(
                chat: _chat!,
                members: data.members,
                selfId: selfId,
                canModerate: canModerate,
                onTyping: presence.reportTyping,
              ),
              ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  PomodoroCard(room: room),
                  const SizedBox(height: 12),
                  CharInputCard(
                    roomId: room.id,
                    position: selfMember.position,
                    todayChars: selfMember.todayChars + _addedToday,
                    onAdded: (delta) => setState(() => _addedToday += delta),
                    onActivity: presence.reportTyping,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NotJoined extends StatelessWidget {
  const _NotJoined({required this.room, required this.onJoined});

  final RoomInfo room;
  final Future<void> Function() onJoined;

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              room.name,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              room.joinType == 'open'
                  ? l10n.roomNotJoined
                  : l10n.roomInviteOnly,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: pal.subtext),
            ),
            if (room.joinType == 'open') ...[
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () async {
                  await WebApi.rpc<Object?>('joinOpenRoom', [room.id]);
                  await onJoined();
                },
                child: Text(l10n.roomEnter),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
