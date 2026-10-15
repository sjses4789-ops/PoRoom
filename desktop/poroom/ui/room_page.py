"""방 화면 — 참여자 카드(실시간 접속 상태·뽀모도로), 내 뽀모도로, 채팅."""
from __future__ import annotations

import time

from PySide6.QtCore import QObject, QTimer, Qt, Signal
from PySide6.QtWidgets import (
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from ..context import AppContext
from ..models import ChatMessage, Presence, RoomInfo, RoomMember
from ..palette import BRAND, BREAK_BLUE, room_color, tint
from ..realtime import latest_meta
from . import theme
from .widgets import Avatar, DonutRing, StatusDot, Stepper, run_async

TYPING_WINDOW_MS = 5000
RETRACK_SECONDS = 8
TRACK_THROTTLE_SECONDS = 2


def fmt_clock(total_seconds: int) -> str:
    s = max(0, int(total_seconds))
    return f"{s // 60:02d}:{s % 60:02d}"


class _RoomBridge(QObject):
    """실시간 스레드에서 오는 신호를 화면 스레드로 넘기는 다리."""

    presence = Signal(dict)
    chat_event = Signal(str, dict)  # (event, payload)


class ParticipantCard(QFrame):
    def __init__(self, ctx: AppContext, member: RoomMember, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._ctx = ctx
        self.member = member
        self.setObjectName("card")
        self.setMinimumWidth(200)

        lay = QVBoxLayout(self)
        lay.setContentsMargins(14, 12, 14, 12)
        lay.setSpacing(6)

        top = QHBoxLayout()
        top.setSpacing(10)
        self._avatar = Avatar(46, room_color(member.chat_color) if member.chat_color else None)
        top.addWidget(self._avatar)
        info = QVBoxLayout()
        info.setSpacing(1)
        self._name = QLabel()
        self._name.setStyleSheet("font-weight: 700; font-size: 14px; border: none; background: transparent;")
        self._status_label = QLabel()
        self._status_label.setStyleSheet(f"color: {theme.MUTED}; font-size: 12px; border: none; background: transparent;")
        info.addWidget(self._name)
        status_row = QHBoxLayout()
        status_row.setSpacing(5)
        self._dot = StatusDot()
        status_row.addWidget(self._dot)
        status_row.addWidget(self._status_label, 1)
        info.addLayout(status_row)
        top.addLayout(info, 1)
        lay.addLayout(top)

        self._work = QLabel()
        self._work.setStyleSheet(f"color: {theme.SUBTEXT}; font-size: 12px; border: none; background: transparent;")
        lay.addWidget(self._work)
        self._pomodoro = QLabel()
        self._pomodoro.setStyleSheet("font-size: 12px; border: none; background: transparent;")
        lay.addWidget(self._pomodoro)
        self._chars = QLabel()
        self._chars.setStyleSheet(f"color: {theme.MUTED}; font-size: 12px; border: none; background: transparent;")
        lay.addWidget(self._chars)

        self._load_avatar()
        self.update_member(member)

    def _load_avatar(self) -> None:
        cid = self.member.character_id
        if not cid:
            return
        repo = self._ctx.repo
        run_async(self, lambda: repo.character_bytes(cid), lambda data, err: self._avatar.set_png(data if isinstance(data, bytes) else None))

    def update_member(self, member: RoomMember) -> None:
        self.member = member
        badges = ("👑 " if member.is_owner else "") + ("⭐ " if member.is_vice else "")
        suffix = " (나)" if member.id == self._ctx.user_id else ""
        self._name.setText(f"{badges}{member.name}{suffix}")
        self._work.setText(member.work_status or "")
        self._work.setVisible(bool(member.work_status))
        unit = "컷" if member.position == "webtoon" else "자"
        if member.records_visible:
            self._chars.setText(f"오늘 {member.today_chars:,}{unit}")
        else:
            self._chars.setText("기록 비공개")

    def set_presence(self, presence: Presence | None, now_ms: float) -> None:
        if presence is None:
            self._dot.set_color(theme.STATUS_OFFLINE)
            self._status_label.setText("비접속")
            self._pomodoro.setText("")
            self.setStyleSheet("QFrame#card { background: #FAFAFA; }")
            return
        self.setStyleSheet("")
        typing = presence.last_typed_at is not None and now_ms - presence.last_typed_at < TYPING_WINDOW_MS
        self._dot.set_color(theme.STATUS_TYPING if typing else theme.STATUS_IDLE)
        self._status_label.setText("작업 중" if typing else "접속 중")

        if presence.pomodoro_phase == "idle":
            self._pomodoro.setText("")
            return
        extra = 0.0
        if presence.pomodoro_progressing:
            extra = (now_ms - presence.pomodoro_snapshot_at) / 1000 / max(presence.pomodoro_duration_seconds, 1)
        fraction = min(1.0, max(0.0, presence.pomodoro_elapsed_fraction + extra))
        remaining = int(presence.pomodoro_duration_seconds * (1 - fraction))
        focus = presence.pomodoro_phase == "focus"
        color = BRAND if focus else BREAK_BLUE
        state = "" if presence.pomodoro_progressing else " (일시정지)"
        self._pomodoro.setText(
            f"<span style='color:{color}'>{'🍅 집중' if focus else '☕ 휴식'} {fmt_clock(remaining)}{state}</span>"
        )


class ChatBubble(QWidget):
    def __init__(self, text: str, name: str, color: str | None, is_self: bool, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(2)
        align = Qt.AlignRight if is_self else Qt.AlignLeft
        who = QLabel(name)
        who.setStyleSheet(f"color: {theme.MUTED}; font-size: 11px;")
        who.setAlignment(align)
        bubble = QLabel(text)
        bubble.setWordWrap(True)
        bubble.setTextInteractionFlags(Qt.TextSelectableByMouse)
        base = room_color(color) if color else "#737373"
        bg = tint(base, 0.14) if not is_self else tint(base, 0.22)
        bubble.setStyleSheet(f"background: {bg}; border-radius: 12px; padding: 7px 11px; color: {theme.TEXT};")
        # 글자 길이에 맞는 너비(최대 300px)로 고정해 필요 이상으로 줄바꿈되지 않게 한다.
        text_width = bubble.fontMetrics().boundingRect(0, 0, 4000, 0, Qt.TextSingleLine, text).width()
        bubble.setFixedWidth(min(300, text_width + 34))
        row = QHBoxLayout()
        row.setContentsMargins(0, 0, 0, 0)
        if is_self:
            row.addStretch(1)
            row.addWidget(bubble)
        else:
            row.addWidget(bubble)
            row.addStretch(1)
        lay.addWidget(who)
        lay.addLayout(row)


class RoomPage(QWidget):
    back = Signal()

    def __init__(self, ctx: AppContext, room_id: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("page")
        self._ctx = ctx
        self._room_id = room_id
        self._info: RoomInfo | None = None
        self._members: list[RoomMember] = []
        self._presence: dict[str, Presence] = {}
        self._messages: list[ChatMessage] = []
        self._cards: dict[str, ParticipantCard] = {}
        self._last_track = 0.0
        self._last_typed_at: float | None = None
        self._closed = False
        self._bridge = _RoomBridge(self)
        self._bridge.presence.connect(self._on_presence)
        self._bridge.chat_event.connect(self._on_chat_event)

        self._build_ui()
        self._connect_realtime()
        self._load_room()
        self._load_messages()

        self._tick = QTimer(self)
        self._tick.setInterval(1000)
        self._tick.timeout.connect(self._on_tick)
        self._tick.start()
        self._data_timer = QTimer(self)
        self._data_timer.setInterval(30_000)
        self._data_timer.timeout.connect(self._load_room)
        self._data_timer.start()
        self._seen_timer = QTimer(self)
        self._seen_timer.setInterval(60_000)
        self._seen_timer.timeout.connect(lambda: run_async(self, lambda: ctx.repo.touch_last_seen(room_id), lambda *_: None))
        self._seen_timer.start()

        ctx.pomodoro.changed.connect(self._on_pomodoro_changed)

    # ── 화면 ───────────────────────────────────────────────────
    def _build_ui(self) -> None:
        outer = QVBoxLayout(self)
        outer.setContentsMargins(24, 18, 24, 18)
        outer.setSpacing(12)

        head = QHBoxLayout()
        back = QPushButton("← 방 목록")
        back.clicked.connect(self.leave)
        head.addWidget(back)
        self._title = QLabel("방")
        self._title.setObjectName("title")
        head.addWidget(self._title, 1)
        self._online = QLabel()
        self._online.setObjectName("muted")
        head.addWidget(self._online)
        outer.addLayout(head)

        body = QHBoxLayout()
        body.setSpacing(16)
        outer.addLayout(body, 1)

        # 왼쪽: 참여자 카드
        left = QVBoxLayout()
        left.setSpacing(8)
        left_title = QLabel("참여자")
        left_title.setObjectName("heading")
        left.addWidget(left_title)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        holder = QWidget()
        holder.setObjectName("page")
        self._grid = QGridLayout(holder)
        self._grid.setSpacing(12)
        self._grid.setAlignment(Qt.AlignTop)
        scroll.setWidget(holder)
        left.addWidget(scroll, 1)
        body.addLayout(left, 3)

        # 오른쪽: 뽀모도로 + 채팅
        right = QVBoxLayout()
        right.setSpacing(12)
        right.addWidget(self._build_pomodoro_card())
        right.addWidget(self._build_chat_card(), 1)
        body.addLayout(right, 2)

    def _build_pomodoro_card(self) -> QWidget:
        card = QFrame()
        card.setObjectName("card")
        lay = QVBoxLayout(card)
        lay.setContentsMargins(16, 14, 16, 14)
        lay.setSpacing(10)
        title = QLabel("뽀모도로")
        title.setObjectName("heading")
        lay.addWidget(title)
        self._ring = DonutRing(150, 12)
        lay.addWidget(self._ring, 0, Qt.AlignHCenter)

        buttons = QHBoxLayout()
        self._start_btn = QPushButton("시작")
        self._start_btn.setObjectName("primary")
        self._start_btn.clicked.connect(self._toggle_pomodoro)
        self._reset_btn = QPushButton("초기화")
        self._reset_btn.clicked.connect(self._ctx.pomodoro.reset)
        buttons.addWidget(self._start_btn, 1)
        buttons.addWidget(self._reset_btn)
        lay.addLayout(buttons)

        mins = QHBoxLayout()
        mins.setSpacing(8)
        mins.addWidget(QLabel("집중"))
        self._focus_spin = Stepper(self._ctx.pomodoro.focus_minutes, 1, 180, " 분")
        self._focus_spin.value_changed.connect(self._ctx.pomodoro.set_focus_minutes)
        mins.addWidget(self._focus_spin)
        mins.addSpacing(8)
        mins.addWidget(QLabel("휴식"))
        self._break_spin = Stepper(self._ctx.pomodoro.break_minutes, 1, 60, " 분")
        self._break_spin.value_changed.connect(self._ctx.pomodoro.set_break_minutes)
        mins.addWidget(self._break_spin)
        mins.addStretch(1)
        lay.addLayout(mins)
        self._refresh_pomodoro_ui()
        return card

    def _build_chat_card(self) -> QWidget:
        card = QFrame()
        card.setObjectName("card")
        lay = QVBoxLayout(card)
        lay.setContentsMargins(14, 12, 14, 12)
        lay.setSpacing(8)
        title = QLabel("채팅")
        title.setObjectName("heading")
        lay.addWidget(title)
        self._chat_scroll = QScrollArea()
        self._chat_scroll.setWidgetResizable(True)
        holder = QWidget()
        holder.setObjectName("page")
        self._chat_layout = QVBoxLayout(holder)
        self._chat_layout.setSpacing(8)
        self._chat_layout.addStretch(1)
        self._chat_scroll.setWidget(holder)
        lay.addWidget(self._chat_scroll, 1)

        row = QHBoxLayout()
        self._input = QLineEdit()
        self._input.setPlaceholderText("메시지를 입력하세요")
        self._input.returnPressed.connect(self._send)
        self._input.textEdited.connect(self._on_typing)
        send = QPushButton("보내기")
        send.setObjectName("dark")
        send.clicked.connect(self._send)
        row.addWidget(self._input, 1)
        row.addWidget(send)
        lay.addLayout(row)
        return card

    # ── 실시간 ─────────────────────────────────────────────────
    @property
    def _presence_channel(self) -> str:
        return f"room-presence:{self._room_id}"

    @property
    def _chat_channel(self) -> str:
        return f"room-chat:{self._room_id}"

    @property
    def _inbox_channel(self) -> str:
        return f"whisper-inbox:{self._room_id}:{self._ctx.user_id}"

    def _connect_realtime(self) -> None:
        rt = self._ctx.realtime
        rt.channel(self._presence_channel, True, self._ctx.user_id)
        rt.on_presence(self._presence_channel, lambda state: self._bridge.presence.emit(state))
        rt.channel(self._chat_channel, True, "")
        for event in ("message", "delete", "clear"):
            rt.on_broadcast(self._chat_channel, event, lambda p, e=event: self._bridge.chat_event.emit(e, p))
        rt.channel(self._inbox_channel, True, "")
        rt.on_broadcast(self._inbox_channel, "whisper", lambda p: self._bridge.chat_event.emit("message", p))
        rt.join(self._presence_channel)
        self._track_self(force=True)

    def _my_payload(self) -> dict:
        pomo = self._ctx.pomodoro
        in_room = pomo.is_active_room(self._room_id)
        phase = pomo.phase if in_room else "idle"
        return {
            "name": self._ctx.profile.name or "",
            "sessionId": self._ctx.session_id,
            "browserId": self._ctx.browser_id,
            "joinedAt": self._joined_at,
            "lastTypedAt": self._last_typed_at,
            "pomodoroPhase": phase,
            "pomodoroProgressing": bool(pomo.running and in_room),
            "pomodoroElapsedFraction": pomo.elapsed_fraction if in_room else 0,
            "pomodoroSnapshotAt": time.time() * 1000,
            "pomodoroDurationSeconds": pomo.phase_duration_seconds if in_room else 0,
            "screenSharing": False,
        }

    _joined_at = time.time() * 1000

    def _track_self(self, force: bool = False) -> None:
        now = time.time()
        if not force and now - self._last_track < 0.3:
            return
        self._last_track = now
        self._ctx.realtime.track(self._presence_channel, self._my_payload())

    def _on_presence(self, state: dict) -> None:
        presence: dict[str, Presence] = {}
        for key, metas in state.items():
            meta = latest_meta(metas)
            if meta:
                presence[key] = Presence.from_meta(meta)
        self._presence = presence
        self._refresh_presence_ui()

    def _on_chat_event(self, event: str, payload: dict) -> None:
        message_id = payload.get("id")
        if event == "clear":
            self._load_messages()
            return
        if not isinstance(message_id, str):
            return
        if event == "message":
            if any(m.id == message_id for m in self._messages):
                return
            # 신호 내용은 믿지 않는다 — DB(보안 규칙이 적용됨)에서 그 메시지를 직접 읽어 확인한 것만 보여 준다.
            run_async(self, lambda: self._ctx.repo.fetch_message(message_id), self._on_fetched_message)
        elif event == "delete":
            run_async(
                self,
                lambda: self._ctx.repo.fetch_message(message_id),
                lambda msg, err: self._remove_message(message_id) if msg is None and err is None else None,
            )

    def _on_fetched_message(self, msg: object, err: Exception | None) -> None:
        if isinstance(msg, ChatMessage) and err is None and not any(m.id == msg.id for m in self._messages):
            self._messages.append(msg)
            self._render_messages()

    def _remove_message(self, message_id: str) -> None:
        self._messages = [m for m in self._messages if m.id != message_id]
        self._render_messages()

    # ── 데이터 ─────────────────────────────────────────────────
    def _load_room(self) -> None:
        run_async(self, lambda: self._ctx.repo.fetch_room(self._room_id), self._on_room)

    def _on_room(self, result: object, error: Exception | None) -> None:
        if self._closed or error is not None or result is None:
            return
        info, members = result  # type: ignore[misc]
        self._info = info
        self._members = members
        if self._ctx.config.preview and not self._presence:
            self._simulate_presence()
        self._title.setText(info.name)
        color = room_color(info.color)
        self._title.setStyleSheet(f"color: {color};")
        self._render_members()

    def _simulate_presence(self) -> None:
        """미리보기(--preview)에서는 실시간 서버가 없으므로 예시 접속 상태를 만든다."""
        now = time.time() * 1000
        self._presence = {
            self._ctx.user_id: Presence(name="미리보기", last_typed_at=now - 1500),
            "u2": Presence(name="하루", pomodoro_phase="focus", pomodoro_progressing=True,
                           pomodoro_elapsed_fraction=0.4, pomodoro_snapshot_at=now, pomodoro_duration_seconds=1500),
            "u3": Presence(name="달빛", pomodoro_phase="break", pomodoro_progressing=False,
                           pomodoro_elapsed_fraction=0.5, pomodoro_snapshot_at=now, pomodoro_duration_seconds=300),
        }

    def _load_messages(self) -> None:
        run_async(self, lambda: self._ctx.repo.fetch_messages(self._room_id), self._on_messages)

    def _on_messages(self, result: object, error: Exception | None) -> None:
        if self._closed or error is not None or not isinstance(result, list):
            return
        seen = {m.id for m in result}
        self._messages = [*result, *[m for m in self._messages if m.id not in seen]]
        self._render_messages()

    # ── 렌더링 ─────────────────────────────────────────────────
    def _render_members(self) -> None:
        existing = {m.id for m in self._members}
        for uid in [u for u in self._cards if u not in existing]:
            card = self._cards.pop(uid)
            self._grid.removeWidget(card)
            card.deleteLater()
        columns = 2
        for i, member in enumerate(self._members):
            card = self._cards.get(member.id)
            if card is None:
                card = ParticipantCard(self._ctx, member)
                self._cards[member.id] = card
            else:
                card.update_member(member)
            self._grid.addWidget(card, i // columns, i % columns)
        self._refresh_presence_ui()

    def _refresh_presence_ui(self) -> None:
        now_ms = time.time() * 1000
        online = 0
        for uid, card in self._cards.items():
            presence = self._presence.get(uid)
            if uid == self._ctx.user_id and presence is None:
                # 내 접속은 곧 반영되므로, 그 사이에는 내 상태로 그린다.
                presence = Presence(**{}) if self._ctx.realtime is None else None
            card.set_presence(presence, now_ms)
            if presence is not None:
                online += 1
        self._online.setText(f"접속 {online} / {len(self._members)}명")

    def _render_messages(self) -> None:
        while self._chat_layout.count() > 1:
            item = self._chat_layout.takeAt(0)
            if item and item.widget():
                item.widget().deleteLater()
        by_id = {m.id: m for m in self._members}
        for msg in self._messages:
            if msg.target_user_id and msg.user_id != self._ctx.user_id and msg.target_user_id != self._ctx.user_id:
                continue
            member = by_id.get(msg.user_id)
            is_self = msg.user_id == self._ctx.user_id
            name = "나" if is_self else (member.name if member else "알 수 없음")
            text = msg.content if not msg.target_user_id else f"🤫 {msg.content}"
            self._chat_layout.insertWidget(self._chat_layout.count() - 1, ChatBubble(text, name, member.chat_color if member else None, is_self))
        QTimer.singleShot(30, lambda: self._chat_scroll.verticalScrollBar().setValue(self._chat_scroll.verticalScrollBar().maximum()))

    # ── 동작 ───────────────────────────────────────────────────
    def _send(self) -> None:
        text = self._input.text().strip()
        if not text:
            return
        self._input.clear()

        def done(msg: object, err: Exception | None) -> None:
            if isinstance(msg, ChatMessage) and err is None:
                if not any(m.id == msg.id for m in self._messages):
                    self._messages.append(msg)
                    self._render_messages()
                # 방 사람들에게 "새 메시지(id)" 신호를 보낸다 — 받는 쪽이 DB에서 읽어 확인한다.
                self._ctx.realtime.send_broadcast(self._chat_channel, "message", {"id": msg.id})
            else:
                self._input.setText(text)

        run_async(self, lambda: self._ctx.repo.send_message(self._room_id, text), done)

    def _on_typing(self, _text: str) -> None:
        now = time.time() * 1000
        if self._last_typed_at and now - self._last_typed_at < TRACK_THROTTLE_SECONDS * 1000:
            return
        self._last_typed_at = now
        self._track_self(force=True)

    def _toggle_pomodoro(self) -> None:
        pomo = self._ctx.pomodoro
        if pomo.running and pomo.is_active_room(self._room_id):
            pomo.pause()
        else:
            pomo.start(self._room_id)

    def _on_pomodoro_changed(self) -> None:
        if self._closed:
            return
        self._refresh_pomodoro_ui()
        pomo = self._ctx.pomodoro
        signature = (pomo.phase, pomo.running, pomo.phase_duration_seconds, pomo.active_room_id)
        if signature != getattr(self, "_last_signature", None):
            self._last_signature = signature
            self._track_self(force=True)

    def _refresh_pomodoro_ui(self) -> None:
        pomo = self._ctx.pomodoro
        active_here = pomo.is_active_room(self._room_id)
        if active_here:
            phase = pomo.phase
            remaining = pomo.remaining_seconds
            fraction = pomo.elapsed_fraction
        else:
            phase = "idle"
            remaining = pomo.focus_minutes * 60
            fraction = 0.0
        color = BREAK_BLUE if phase == "break" else BRAND
        caption = {"idle": "대기", "focus": "집중 중", "break": "휴식 중"}[phase]
        self._ring.set_state(fraction, color, fmt_clock(remaining), caption)
        self._start_btn.setText("일시정지" if (pomo.running and active_here) else ("계속" if active_here and pomo.started else "시작"))

    def _on_tick(self) -> None:
        self._refresh_presence_ui()
        # 접속 상태를 주기적으로 다시 알려 유실에 대비한다(웹의 retrack과 같은 이유).
        if time.time() - self._last_track >= RETRACK_SECONDS:
            self._track_self(force=True)

    # ── 나가기 ─────────────────────────────────────────────────
    def leave(self) -> None:
        self.close_room()
        self.back.emit()

    def close_room(self) -> None:
        if self._closed:
            return
        self._closed = True
        for timer in (self._tick, self._data_timer, self._seen_timer):
            timer.stop()
        try:
            self._ctx.pomodoro.changed.disconnect(self._on_pomodoro_changed)
        except (TypeError, RuntimeError):
            pass
        rt = self._ctx.realtime
        rt.send_broadcast(self._presence_channel, "presence-left", {"userId": self._ctx.user_id, "sessionId": self._ctx.session_id})
        for name in (self._presence_channel, self._chat_channel, self._inbox_channel):
            rt.leave(name)
        # 마감방/새벽방은 떠나면 방에서 나간 것이다(참여자 목록에서도 사라진다) — 뽀모도로는 기록하고 멈춘다.
        if self._info and self._info.is_system:
            pomo = self._ctx.pomodoro
            if pomo.is_active_room(self._room_id) and pomo.running:
                pomo.pause()
            room_id = self._room_id
            run_async(self, lambda: self._ctx.repo.leave_room(room_id), lambda *_: None)
