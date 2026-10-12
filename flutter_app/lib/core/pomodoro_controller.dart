import 'dart:async';

import 'package:flutter/widgets.dart';

import 'time_util.dart';
import 'web_api.dart';

enum PomodoroPhase { idle, focus, rest }

class ActiveRoom {
  const ActiveRoom({required this.id, required this.name});

  final String id;
  final String name;
}

// 웹(src/app/(main)/pomodoro-context.tsx)과 같은 방식의 타이머를 앱이 직접 돌린다.
// 틱마다 "1초 지났다"고 가정하지 않고 진짜 시계로 지난 시간을 계산해 따라잡기 때문에, 앱이 잠깐 멈췄다
// 돌아와도 시간이 어긋나지 않는다. 집중/휴식 시간은 1분이 찰 때마다 웹과 같은 서버 로직으로 기록한다.
class PomodoroController extends ChangeNotifier with WidgetsBindingObserver {
  PomodoroController() {
    WidgetsBinding.instance.addObserver(this);
  }

  ActiveRoom? activeRoom;
  int focusMinutes = 25;
  int breakMinutes = 5;
  bool running = false;
  bool started = false;
  bool _inFocus = true;
  int _tickingSeconds = 25 * 60;
  int accumulatedFocusSeconds = 0;
  int accumulatedBreakSeconds = 0;
  int focusSessionCount = 0;

  Timer? _timer;
  DateTime _lastTick = DateTime.now();
  DateTime _sessionStart = DateTime.now();
  int _flushedFocus = 0;
  int _flushedBreak = 0;

  int get phaseDurationSeconds => (_inFocus ? focusMinutes : breakMinutes) * 60;
  int get remainingSeconds => started ? _tickingSeconds : phaseDurationSeconds;
  double get elapsedFraction => started ? 1 - _tickingSeconds / phaseDurationSeconds : 0;
  PomodoroPhase get phase => !started ? PomodoroPhase.idle : (_inFocus ? PomodoroPhase.focus : PomodoroPhase.rest);

  bool isActiveRoom(String roomId) => activeRoom?.id == roomId;

  void setFocusMinutes(int n) {
    focusMinutes = n.clamp(1, 180);
    if (!started) _tickingSeconds = focusMinutes * 60;
    notifyListeners();
  }

  void setBreakMinutes(int n) {
    breakMinutes = n.clamp(1, 60);
    notifyListeners();
  }

  void start(ActiveRoom room) {
    final isNewRoom = activeRoom?.id != room.id;
    if (isNewRoom || !started) {
      _tickingSeconds = phaseDurationSeconds;
    }
    if (isNewRoom) {
      activeRoom = room;
      accumulatedFocusSeconds = 0;
      accumulatedBreakSeconds = 0;
      _flushedFocus = 0;
      _flushedBreak = 0;
      _sessionStart = DateTime.now();
    }
    if (isNewRoom || !started) {
      started = true;
      focusSessionCount += 1;
    }
    running = true;
    _lastTick = DateTime.now();
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _catchUp());
    notifyListeners();
  }

  void pause() {
    if (!running) return;
    _catchUp();
    running = false;
    _timer?.cancel();
    flushPending();
    notifyListeners();
  }

  void reset() {
    flushPending();
    running = false;
    started = false;
    _inFocus = true;
    _tickingSeconds = focusMinutes * 60;
    activeRoom = null;
    accumulatedFocusSeconds = 0;
    accumulatedBreakSeconds = 0;
    _flushedFocus = 0;
    _flushedBreak = 0;
    focusSessionCount = 0;
    _timer?.cancel();
    notifyListeners();
  }

  void _catchUp() {
    final now = DateTime.now();
    final elapsedMs = now.difference(_lastTick).inMilliseconds;
    var elapsedSec = elapsedMs ~/ 1000;
    if (elapsedSec <= 0) return;
    // 1초 미만의 나머지는 버리지 않고 다음 계산을 위해 남겨 둔다.
    _lastTick = now.subtract(Duration(milliseconds: elapsedMs % 1000));

    var inFocus = _inFocus;
    var remaining = _tickingSeconds;
    var focusDelta = 0;
    var breakDelta = 0;
    var sessionDelta = 0;

    while (elapsedSec > 0) {
      if (elapsedSec < remaining) {
        if (inFocus) {
          focusDelta += elapsedSec;
        } else {
          breakDelta += elapsedSec;
        }
        remaining -= elapsedSec;
        elapsedSec = 0;
      } else {
        if (inFocus) {
          focusDelta += remaining;
        } else {
          breakDelta += remaining;
        }
        elapsedSec -= remaining;
        inFocus = !inFocus;
        remaining = (inFocus ? focusMinutes : breakMinutes) * 60;
        if (inFocus) sessionDelta += 1;
      }
    }

    _inFocus = inFocus;
    _tickingSeconds = remaining;
    accumulatedFocusSeconds += focusDelta;
    accumulatedBreakSeconds += breakDelta;
    focusSessionCount += sessionDelta;
    _flushWholeMinutes();
    notifyListeners();
  }

  // 1분이 찰 때마다 서버에 기록한다(웹의 recordFocusMinutes / recordBreakMinutes).
  void _flushWholeMinutes() {
    final room = activeRoom;
    if (room == null) return;
    final date = effectiveRecordDate(_sessionStart);
    final fm = accumulatedFocusSeconds ~/ 60;
    if (fm > _flushedFocus) {
      final delta = fm - _flushedFocus;
      _flushedFocus = fm;
      WebApi.rpc<Object?>('recordFocusMinutes', [room.id, delta, date, false]);
    }
    final bm = accumulatedBreakSeconds ~/ 60;
    if (bm > _flushedBreak) {
      final delta = bm - _flushedBreak;
      _flushedBreak = bm;
      WebApi.rpc<Object?>('recordBreakMinutes', [room.id, delta, date]);
    }
  }

  // 멈추거나 방을 나가기 직전, 아직 한 분이 안 찬 시간(수십 초)도 반올림해서 마지막으로 반영한다.
  void flushPending() {
    final room = activeRoom;
    if (room == null) return;
    final date = effectiveRecordDate(_sessionStart);
    final fm = (accumulatedFocusSeconds / 60).round();
    if (fm > _flushedFocus) {
      final delta = fm - _flushedFocus;
      _flushedFocus = fm;
      WebApi.rpc<Object?>('recordFocusMinutes', [room.id, delta, date]);
    }
    final bm = (accumulatedBreakSeconds / 60).round();
    if (bm > _flushedBreak) {
      final delta = bm - _flushedBreak;
      _flushedBreak = bm;
      WebApi.rpc<Object?>('recordBreakMinutes', [room.id, delta, date]);
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && running) _catchUp();
    if (state == AppLifecycleState.paused) flushPending();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }
}

class PomodoroScope extends InheritedNotifier<PomodoroController> {
  const PomodoroScope({super.key, required PomodoroController controller, required super.child})
      : super(notifier: controller);

  static PomodoroController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<PomodoroScope>();
    assert(scope != null, 'PomodoroScope 가 위젯 트리에 없어요.');
    return scope!.notifier!;
  }
}
