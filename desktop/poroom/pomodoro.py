"""뽀모도로 — 웹(pomodoro-context.tsx)·앱(pomodoro_controller.dart)과 같은 방식의 타이머.

틱마다 "1초 지났다"고 가정하지 않고 진짜 시계로 지난 시간을 계산해 따라잡기 때문에, 프로그램이 잠깐 멈췄다 돌아와도
시간이 어긋나지 않는다. 집중/휴식 시간은 1분이 찰 때마다 서버에 기록한다(웹과 같은 서버 로직).
"""
from __future__ import annotations

import threading
import time
from datetime import datetime

from PySide6.QtCore import QObject, QTimer, Signal

from .repo import RepositoryProtocol


def effective_record_date(session_start: datetime, now: datetime | None = None) -> str:
    """기록 날짜는 기기(로컬) 기준 — 23시 이후 시작한 세션은 새벽 1시까지 시작한 날의 기록으로 남긴다(웹과 같은 규칙)."""
    now = now or datetime.now()
    if now.hour < 1:
        started_yesterday = session_start.date() != now.date()
        if started_yesterday and session_start.hour >= 23:
            return session_start.strftime("%Y-%m-%d")
    return now.strftime("%Y-%m-%d")


class PomodoroController(QObject):
    changed = Signal()

    def __init__(self, repo: RepositoryProtocol) -> None:
        super().__init__()
        self._repo = repo
        self.active_room_id: str | None = None
        self.focus_minutes = 25
        self.break_minutes = 5
        self.running = False
        self.started = False
        self._in_focus = True
        self._ticking_seconds = 25 * 60
        self.accumulated_focus_seconds = 0
        self.accumulated_break_seconds = 0
        self.focus_session_count = 0
        self._last_tick = time.monotonic()
        self._session_start = datetime.now()
        self._flushed_focus = 0
        self._flushed_break = 0
        self._timer = QTimer(self)
        self._timer.setInterval(1000)
        self._timer.timeout.connect(self._catch_up)

    # ── 읽기 ───────────────────────────────────────────────────
    @property
    def phase_duration_seconds(self) -> int:
        return (self.focus_minutes if self._in_focus else self.break_minutes) * 60

    @property
    def remaining_seconds(self) -> int:
        return self._ticking_seconds if self.started else self.phase_duration_seconds

    @property
    def elapsed_fraction(self) -> float:
        if not self.started:
            return 0.0
        return 1 - self._ticking_seconds / max(self.phase_duration_seconds, 1)

    @property
    def phase(self) -> str:
        if not self.started:
            return "idle"
        return "focus" if self._in_focus else "break"

    def is_active_room(self, room_id: str) -> bool:
        return self.active_room_id == room_id

    # ── 설정 ───────────────────────────────────────────────────
    def set_focus_minutes(self, n: int) -> None:
        self.focus_minutes = max(1, min(180, n))
        if not self.started:
            self._ticking_seconds = self.focus_minutes * 60
        self.changed.emit()

    def set_break_minutes(self, n: int) -> None:
        self.break_minutes = max(1, min(60, n))
        self.changed.emit()

    # ── 조작 ───────────────────────────────────────────────────
    def start(self, room_id: str) -> None:
        is_new_room = self.active_room_id != room_id
        if is_new_room and self.started:
            self.flush_pending()
        if is_new_room or not self.started:
            self._ticking_seconds = self.phase_duration_seconds
        if is_new_room:
            self.active_room_id = room_id
            self.accumulated_focus_seconds = 0
            self.accumulated_break_seconds = 0
            self._flushed_focus = 0
            self._flushed_break = 0
            self._session_start = datetime.now()
        if is_new_room or not self.started:
            self.started = True
            self.focus_session_count += 1
        self.running = True
        self._last_tick = time.monotonic()
        self._timer.start()
        self.changed.emit()

    def pause(self) -> None:
        if not self.running:
            return
        self._catch_up()
        self.running = False
        self._timer.stop()
        self.flush_pending()
        self.changed.emit()

    def reset(self) -> None:
        self.flush_pending()
        self.running = False
        self.started = False
        self._in_focus = True
        self._ticking_seconds = self.focus_minutes * 60
        self.active_room_id = None
        self.accumulated_focus_seconds = 0
        self.accumulated_break_seconds = 0
        self._flushed_focus = 0
        self._flushed_break = 0
        self.focus_session_count = 0
        self._timer.stop()
        self.changed.emit()

    # ── 시간 흐름 ──────────────────────────────────────────────
    def _catch_up(self) -> None:
        now = time.monotonic()
        elapsed_ms = int((now - self._last_tick) * 1000)
        elapsed = elapsed_ms // 1000
        if elapsed <= 0:
            return
        # 1초 미만의 나머지는 버리지 않고 다음 계산을 위해 남겨 둔다.
        self._last_tick = now - (elapsed_ms % 1000) / 1000

        in_focus = self._in_focus
        remaining = self._ticking_seconds
        focus_delta = break_delta = session_delta = 0
        while elapsed > 0:
            if elapsed < remaining:
                if in_focus:
                    focus_delta += elapsed
                else:
                    break_delta += elapsed
                remaining -= elapsed
                elapsed = 0
            else:
                if in_focus:
                    focus_delta += remaining
                else:
                    break_delta += remaining
                elapsed -= remaining
                in_focus = not in_focus
                remaining = (self.focus_minutes if in_focus else self.break_minutes) * 60
                if in_focus:
                    session_delta += 1

        self._in_focus = in_focus
        self._ticking_seconds = remaining
        self.accumulated_focus_seconds += focus_delta
        self.accumulated_break_seconds += break_delta
        self.focus_session_count += session_delta
        self._flush_whole_minutes()
        self.changed.emit()

    def _run_bg(self, fn, *args) -> None:
        """서버 기록은 화면이 멈추지 않게 따로 보낸다."""
        threading.Thread(target=fn, args=args, daemon=True).start()

    def _flush_whole_minutes(self) -> None:
        room = self.active_room_id
        if not room:
            return
        date = effective_record_date(self._session_start)
        fm = self.accumulated_focus_seconds // 60
        if fm > self._flushed_focus:
            delta = fm - self._flushed_focus
            self._flushed_focus = fm
            self._run_bg(self._repo.record_focus, room, delta, date, False)
        bm = self.accumulated_break_seconds // 60
        if bm > self._flushed_break:
            delta = bm - self._flushed_break
            self._flushed_break = bm
            self._run_bg(self._repo.record_break, room, delta, date)

    def flush_pending(self) -> None:
        """멈추거나 방을 나가기 직전, 아직 한 분이 안 찬 시간도 반올림해서 마지막으로 반영한다."""
        room = self.active_room_id
        if not room:
            return
        date = effective_record_date(self._session_start)
        fm = round(self.accumulated_focus_seconds / 60)
        if fm > self._flushed_focus:
            delta = fm - self._flushed_focus
            self._flushed_focus = fm
            self._run_bg(self._repo.record_focus, room, delta, date, True)
        bm = round(self.accumulated_break_seconds / 60)
        if bm > self._flushed_break:
            delta = bm - self._flushed_break
            self._flushed_break = bm
            self._run_bg(self._repo.record_break, room, delta, date)
