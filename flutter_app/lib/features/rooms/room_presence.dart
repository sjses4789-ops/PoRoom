import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/browser_id.dart';
import '../../core/env.dart';
import '../../core/pomodoro_controller.dart';

enum PresenceStatus { offline, idle, typing }

class PomodoroView {
  const PomodoroView(this.phase, this.elapsedFraction);

  final PomodoroPhase phase;
  final double elapsedFraction;
}

// 웹(use-room-presence.ts)과 같은 방식 — 방 접속 채널(room-presence:방id, 비공개)에 내 상태를 track()하고,
// 다른 참여자의 접속/타이핑/뽀모도로 진행을 받아 온다. 웹 사용자와 앱 사용자가 한 방에서 서로 보인다.
class RoomPresenceController extends ChangeNotifier {
  RoomPresenceController({required this.roomId, required this.selfId, required this.selfName}) {
    if (Env.preview) {
      _previewOnline = {'u2', 'u4'};
      return;
    }
    _sessionId = BrowserId.newSessionId();
    _joinedAt = DateTime.now().millisecondsSinceEpoch;
    _connect();
    _retrack = Timer.periodic(const Duration(seconds: 8), (_) => _track());
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _notify());
  }

  static const _typingWindowMs = 5000;
  static const _graceMs = 5 * 60 * 1000;

  final String roomId;
  final String selfId;
  final String selfName;

  RealtimeChannel? _channel;
  Timer? _retrack;
  Timer? _ticker;
  Timer? _retry;
  bool _subscribed = false;
  bool _disposed = false;
  Set<String> _previewOnline = {};
  String _sessionId = '';
  int _joinedAt = 0;

  // 지금 presence에 있는 사람들의 마지막 payload.
  final Map<String, Map<String, dynamic>> _live = {};
  // 잠깐 presence에서 빠져도 유예 시간 동안은 마지막 상태를 보여 주기 위한 기록.
  final Map<String, int> _lastSeenAt = {};
  final Map<String, Map<String, dynamic>> _lastKnown = {};
  // "나갔다"고 직접 알려 온 사람 → 그 접속의 sessionId.
  final Map<String, String?> _left = {};

  // 내 상태(다른 참여자에게 보이는 값).
  int? _lastTypedAt;
  PomodoroPhase _phase = PomodoroPhase.idle;
  bool _progressing = false;
  double _elapsedFraction = 0;
  int _snapshotAt = 0;
  int _durationSeconds = 0;

  // 같은 계정이 다른 브라우저/기기에서 이 방에 먼저 접속해 있고 내가 나중에 들어온 경우.
  bool duplicateSession = false;
  bool _claimed = false;
  // 다른 기기에서 "이 화면에서 계속"을 골라 이 접속이 밀려난 경우.
  bool takenOver = false;

  SupabaseClient get _client => Supabase.instance.client;

  Map<String, dynamic> _payload() => {
        'sessionId': _sessionId,
        'browserId': BrowserId.value,
        'joinedAt': _joinedAt,
        'name': selfName,
        'lastTypedAt': _lastTypedAt,
        'pomodoroPhase': switch (_phase) {
          PomodoroPhase.idle => 'idle',
          PomodoroPhase.focus => 'focus',
          PomodoroPhase.rest => 'break',
        },
        'pomodoroProgressing': _progressing,
        'pomodoroElapsedFraction': _elapsedFraction,
        'pomodoroSnapshotAt': _snapshotAt,
        'pomodoroDurationSeconds': _durationSeconds,
      };

  void _connect() {
    if (_disposed) return;
    _subscribed = false;
    final channel = _client.channel(
      'room-presence:$roomId',
      opts: RealtimeChannelConfig(key: selfId, private: true),
    );
    _channel = channel;
    channel
      ..onPresenceSync((_) => _syncFromState())
      ..onPresenceJoin((_) => _syncFromState())
      ..onPresenceLeave((_) => _syncFromState())
      ..onBroadcast(event: 'presence-left', callback: (p) => _onLeft(_inner(p)))
      ..onBroadcast(event: 'session-takeover', callback: (p) => _onTakeover(_inner(p)))
      ..subscribe((status, error) async {
        if (_disposed || channel != _channel) return;
        if (status == RealtimeSubscribeStatus.subscribed) {
          _subscribed = true;
          await _track();
        } else if (status == RealtimeSubscribeStatus.channelError ||
            status == RealtimeSubscribeStatus.timedOut ||
            status == RealtimeSubscribeStatus.closed) {
          _subscribed = false;
          _retry?.cancel();
          // 실패한 채널은 버리고 새 채널로 처음부터 다시 구독한다(웹과 같은 이유).
          _retry = Timer(const Duration(seconds: 2), () {
            _client.removeChannel(channel);
            _connect();
          });
        }
      });
  }

  // 브로드캐스트 콜백은 보낸 payload를 {event, payload, type}로 감싸 주기도 한다 — 안쪽 값을 꺼낸다.
  Map<String, dynamic> _inner(Map<String, dynamic> raw) {
    final inner = raw['payload'];
    return inner is Map ? Map<String, dynamic>.from(inner) : raw;
  }

  Future<void> _track() async {
    final channel = _channel;
    if (!_subscribed || channel == null) return;
    try {
      await channel.track(_payload());
    } catch (_) {}
  }

  void _syncFromState() {
    final channel = _channel;
    if (channel == null) return;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    final state = channel.presenceState();
    _live.clear();
    for (final entry in state) {
      if (entry.presences.isEmpty) continue;
      final latest = Map<String, dynamic>.from(entry.presences.last.payload);
      _live[entry.key] = latest;
      if (_left.containsKey(entry.key)) {
        final leftSession = _left[entry.key];
        final sid = latest['sessionId'] as String?;
        if (leftSession != null && sid != null && sid != leftSession) {
          _left.remove(entry.key);
        } else {
          continue;
        }
      }
      _lastSeenAt[entry.key] = nowMs;
      _lastKnown[entry.key] = latest;
    }
    _left.removeWhere((key, _) => !_live.containsKey(key));

    // 중복 접속 확인: 내 계정으로 다른 기기에서 이미 들어와 있는 접속이 있고 내가 가장 나중이면 경고한다.
    final mine = state.where((s) => s.key == selfId).expand((s) => s.presences);
    final others = mine.where((p) {
      final b = p.payload['browserId'] as String?;
      return p.payload['sessionId'] != _sessionId && b != null && b != BrowserId.value;
    }).toList();
    final iAmNewest = others.every((p) {
      final j = (p.payload['joinedAt'] as num?)?.toInt() ?? 0;
      return j < _joinedAt || (j == _joinedAt && ((p.payload['sessionId'] as String?) ?? '').compareTo(_sessionId) < 0);
    });
    duplicateSession = others.isNotEmpty && iAmNewest && !_claimed;
    _notify();
  }

  void _onLeft(Map<String, dynamic> p) {
    final userId = p['userId'] as String?;
    if (userId == null) return;
    // 같은 사용자가 다른 탭/기기에서도 접속 중이면(presence 항목이 2개 이상) 나간 게 아니다.
    final metas = _channel?.presenceState().where((s) => s.key == userId).expand((s) => s.presences) ?? const [];
    if (metas.length > 1) return;
    _left[userId] = p['sessionId'] as String?;
    _lastSeenAt.remove(userId);
    _lastKnown.remove(userId);
    _notify();
  }

  void _onTakeover(Map<String, dynamic> p) {
    final userId = p['userId'] as String?;
    final browserId = p['browserId'] as String?;
    if (userId == selfId && browserId != null && browserId != BrowserId.value) {
      takenOver = true;
      _notify();
    }
  }

  // 다른 기기에서 이미 접속 중인데 "이 화면에서 계속 사용"을 고른 경우 — 그쪽 접속을 밀어낸다.
  void claimSession() {
    _claimed = true;
    duplicateSession = false;
    _channel
        ?.sendBroadcastMessage(
          event: 'session-takeover',
          payload: {'userId': selfId, 'browserId': BrowserId.value},
        )
        .catchError((_) => ChannelResponse.error);
    _notify();
  }

  // 키 입력(채팅/기록 입력)이 있었음을 알린다 — 다른 참여자 카드에 "입력 중"으로 보인다.
  DateTime _lastReport = DateTime.fromMillisecondsSinceEpoch(0);
  void reportTyping() {
    final now = DateTime.now();
    if (now.difference(_lastReport) < const Duration(seconds: 2)) return;
    _lastReport = now;
    _lastTypedAt = now.millisecondsSinceEpoch;
    _track();
  }

  // 내 뽀모도로 진행 상태를 다른 참여자에게 알린다 — 진행률 값 대신 "스냅샷 시점 진행률 + 시각 + 구간 길이"를
  // 보내서, 보는 쪽이 이후 흐른 시간을 스스로 계산한다(웹과 같은 payload).
  void setPomodoroState(PomodoroPhase phase, double elapsedFraction, bool progressing, int durationSeconds) {
    _phase = phase;
    _elapsedFraction = elapsedFraction;
    _progressing = progressing;
    _durationSeconds = durationSeconds;
    _snapshotAt = DateTime.now().millisecondsSinceEpoch;
    _track();
  }

  Map<String, dynamic>? _effective(String userId) {
    if (_left.containsKey(userId)) {
      final leftSession = _left[userId];
      final live = _live[userId];
      final sid = live?['sessionId'] as String?;
      if (!(leftSession != null && sid != null && sid != leftSession)) return null;
    }
    final live = _live[userId];
    if (live != null) return live;
    final seen = _lastSeenAt[userId];
    if (seen != null && DateTime.now().millisecondsSinceEpoch - seen < _graceMs) return _lastKnown[userId];
    return null;
  }

  PresenceStatus statusOf(String userId) {
    if (Env.preview) return _previewOnline.contains(userId) || userId == selfId ? PresenceStatus.idle : PresenceStatus.offline;
    final p = _effective(userId);
    if (p == null) return PresenceStatus.offline;
    final typed = (p['lastTypedAt'] as num?)?.toInt();
    if (typed != null && DateTime.now().millisecondsSinceEpoch - typed < _typingWindowMs) return PresenceStatus.typing;
    return PresenceStatus.idle;
  }

  PomodoroView pomodoroOf(String userId) {
    if (Env.preview) {
      return userId == 'u2' ? const PomodoroView(PomodoroPhase.focus, 0.4) : const PomodoroView(PomodoroPhase.idle, 0);
    }
    final p = _effective(userId);
    final phaseName = p?['pomodoroPhase'] as String?;
    if (p == null || phaseName == null || phaseName == 'idle') return const PomodoroView(PomodoroPhase.idle, 0);
    final progressing = p['pomodoroProgressing'] == true;
    final duration = ((p['pomodoroDurationSeconds'] as num?) ?? 1).toDouble().clamp(1, double.infinity);
    final snapshotAt = (p['pomodoroSnapshotAt'] as num?)?.toInt() ?? 0;
    final base = ((p['pomodoroElapsedFraction'] as num?) ?? 0).toDouble();
    final extra = progressing ? (DateTime.now().millisecondsSinceEpoch - snapshotAt) / 1000 / duration : 0;
    return PomodoroView(
      phaseName == 'break' ? PomodoroPhase.rest : PomodoroPhase.focus,
      (base + extra).clamp(0, 1).toDouble(),
    );
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _retrack?.cancel();
    _ticker?.cancel();
    _retry?.cancel();
    final channel = _channel;
    if (channel != null && !Env.preview) {
      // 페이지를 나갈 때 다른 참여자에게 "나갔다"고 직접 알린다(유예 시간 동안 접속 중으로 보이지 않도록).
      if (_subscribed) {
        channel
            .sendBroadcastMessage(event: 'presence-left', payload: {'userId': selfId, 'sessionId': _sessionId})
            .catchError((_) => ChannelResponse.error)
            .whenComplete(() => _client.removeChannel(channel));
      } else {
        _client.removeChannel(channel);
      }
    }
    super.dispose();
  }
}
