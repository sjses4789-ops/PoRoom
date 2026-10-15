"""[포룸] 홈 — 인사, 지금 들어갈 수 있는 상시 작업방, 내 방, 열린 방."""
from __future__ import annotations

from PySide6.QtCore import QTimer, Qt, Signal
from PySide6.QtWidgets import (
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from ..context import AppContext
from ..models import RoomSummary
from ..palette import room_color, tint
from . import theme
from .widgets import run_async


class RoomCard(QFrame):
    clicked = Signal(object)

    def __init__(self, room: RoomSummary, action_text: str | None, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._room = room
        self.setObjectName("card")
        color = room_color(room.color)
        self.setStyleSheet(
            f"QFrame#card {{ background: {tint(color, 0.07)}; border: 1px solid {tint(color, 0.35)}; border-radius: 14px; }}"
            f"QFrame#card:hover {{ border: 1px solid {color}; }}"
        )
        self.setCursor(Qt.PointingHandCursor)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(16, 14, 16, 14)
        lay.setSpacing(8)

        head = QHBoxLayout()
        dot = QLabel("●")
        dot.setStyleSheet(f"color: {color}; font-size: 11px; border: none; background: transparent;")
        name = QLabel(room.name)
        name.setStyleSheet("font-weight: 700; font-size: 14px; border: none; background: transparent;")
        count_text = f"{room.member_count}명" + (f" / {room.capacity}" if room.capacity else "")
        count = QLabel(count_text)
        count.setStyleSheet(f"color: {theme.MUTED}; font-size: 12px; border: none; background: transparent;")
        head.addWidget(dot)
        head.addWidget(name, 1)
        head.addWidget(count)
        lay.addLayout(head)

        chips = QHBoxLayout()
        chips.setSpacing(6)
        join_label = "열린 방" if room.is_open else "초대 전용"
        for text in [join_label, *room.tags[:3]]:
            chip = QLabel(text)
            chip.setStyleSheet(
                f"color: {theme.SUBTEXT}; font-size: 11px; padding: 2px 8px; border: 1px solid {theme.LINE};"
                "border-radius: 9px; background: rgba(255,255,255,0.7);"
            )
            chips.addWidget(chip)
        chips.addStretch(1)
        lay.addLayout(chips)

        if action_text:
            row = QHBoxLayout()
            row.addStretch(1)
            btn = QPushButton(action_text)
            btn.setObjectName("dark")
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda: self.clicked.emit(self._room))
            row.addWidget(btn)
            lay.addLayout(row)

    def mouseReleaseEvent(self, event) -> None:  # noqa: N802
        if event.button() == Qt.LeftButton:
            self.clicked.emit(self._room)
        super().mouseReleaseEvent(event)


class HomePage(QWidget):
    open_room = Signal(str)

    def __init__(self, ctx: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("page")
        self._ctx = ctx
        self._rooms: list[RoomSummary] = []
        self._busy = False

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        outer.addWidget(scroll)
        body = QWidget()
        body.setObjectName("page")
        scroll.setWidget(body)
        self._lay = QVBoxLayout(body)
        self._lay.setContentsMargins(28, 24, 28, 28)
        self._lay.setSpacing(16)

        self._greeting = QLabel()
        self._greeting.setObjectName("title")
        self._lay.addWidget(self._greeting)
        self._sub = QLabel("오늘도 함께 집중해 봐요.")
        self._sub.setObjectName("sub")
        self._lay.addWidget(self._sub)

        self._system_row = QHBoxLayout()
        self._system_row.setSpacing(12)
        self._lay.addLayout(self._system_row)
        for kind, label, hint in (("deadline", "마감방", "마감이 코앞일 때 모여요"), ("dawn", "새벽방", "새벽에 함께 써요")):
            self._system_row.addWidget(self._system_button(kind, label, hint))

        self._my_header = self._section_header("내 방")
        self._my_grid = QGridLayout()
        self._my_grid.setSpacing(12)
        self._open_header = self._section_header("열린 방")
        self._open_grid = QGridLayout()
        self._open_grid.setSpacing(12)
        self._lay.addWidget(self._my_header)
        self._lay.addLayout(self._my_grid)
        self._lay.addWidget(self._open_header)
        self._lay.addLayout(self._open_grid)
        self._empty = QLabel()
        self._empty.setObjectName("muted")
        self._lay.addWidget(self._empty)
        self._lay.addStretch(1)

        self._refresh_greeting()
        self.refresh()
        self._timer = QTimer(self)
        self._timer.setInterval(30_000)
        self._timer.timeout.connect(self.refresh)
        self._timer.start()

    # ── 부품 ───────────────────────────────────────────────────
    def _section_header(self, text: str) -> QLabel:
        label = QLabel(text)
        label.setObjectName("heading")
        return label

    def _system_button(self, kind: str, label: str, hint: str) -> QWidget:
        box = QFrame()
        box.setObjectName("card")
        box.setCursor(Qt.PointingHandCursor)
        lay = QVBoxLayout(box)
        lay.setContentsMargins(18, 14, 18, 14)
        title = QLabel(label)
        title.setStyleSheet("font-size: 16px; font-weight: 800; border: none; background: transparent;")
        sub = QLabel(hint)
        sub.setObjectName("muted")
        sub.setStyleSheet(f"color: {theme.MUTED}; border: none; background: transparent;")
        lay.addWidget(title)
        lay.addWidget(sub)
        box.mouseReleaseEvent = lambda _e, k=kind: self._enter_system(k)  # type: ignore[method-assign]
        return box

    def _refresh_greeting(self) -> None:
        name = self._ctx.profile.name or "작가"
        self._greeting.setText(f"{name}님, 안녕하세요")

    # ── 동작 ───────────────────────────────────────────────────
    def refresh(self) -> None:
        if self._busy:
            return
        self._busy = True
        run_async(self, self._ctx.repo.fetch_rooms, self._on_rooms)

    def _on_rooms(self, result: object, error: Exception | None) -> None:
        self._busy = False
        if error is not None or not isinstance(result, list):
            self._empty.setText("방 목록을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.")
            return
        self._rooms = result
        self._render()

    def _clear(self, grid: QGridLayout) -> None:
        while grid.count():
            item = grid.takeAt(0)
            if item and item.widget():
                item.widget().deleteLater()

    def _render(self) -> None:
        self._clear(self._my_grid)
        self._clear(self._open_grid)
        mine = [r for r in self._rooms if r.is_member and not r.is_system]
        others = [r for r in self._rooms if not r.is_member and not r.is_system and r.is_open]
        for grid, rooms, action in ((self._my_grid, mine, None), (self._open_grid, others, "입장하기")):
            for i, room in enumerate(rooms):
                card = RoomCard(room, action)
                card.clicked.connect(self._on_room_clicked)
                grid.addWidget(card, i // 2, i % 2)
        self._my_header.setVisible(bool(mine))
        self._open_header.setVisible(bool(others))
        self._empty.setText("" if (mine or others) else "참여할 수 있는 방이 아직 없어요.")

    def _on_room_clicked(self, room: RoomSummary) -> None:
        if room.is_member:
            self.open_room.emit(room.id)
            return
        run_async(
            self,
            lambda: self._ctx.repo.join_open_room(room.id),
            lambda ok, err: self.open_room.emit(room.id) if ok and err is None else self._empty.setText("입장하지 못했어요."),
        )

    def _enter_system(self, kind: str) -> None:
        run_async(
            self,
            lambda: self._ctx.repo.join_system_room(kind),
            lambda room_id, err: self.open_room.emit(room_id)
            if isinstance(room_id, str) and err is None
            else self._empty.setText("입장하지 못했어요."),
        )
