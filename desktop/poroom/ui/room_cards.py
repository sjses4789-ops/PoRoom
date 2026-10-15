"""방 카드 두 가지 — 전체/추천 방 목록의 카드(웹의 room-card.tsx)와 "내가 입장한 방"의 작은 카드(MyRoomCard). 치수는 웹 그대로."""
from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import QFrame, QHBoxLayout, QLabel, QPushButton, QVBoxLayout, QWidget

from ..models import RoomItem
from ..palette import palette_card, palette_dot
from .layouts import FlowLayout
from .scale import N400, N500, N600, N700, RADIUS, fs, sp

_FLAT = "border: none; background: transparent;"


def _chip(text: str) -> QLabel:
    """공개/비공개·입장 직업 표시 — rounded border px-1.5 py-0.5 text-[11px] text-neutral-500."""
    chip = QLabel(text)
    chip.setStyleSheet(
        f"color: {N500}; {fs(11)} padding: {sp(0.5)}px {sp(1.5)}px; border: 1px solid #D4D4D4; border-radius: 4px; background: transparent;"
    )
    return chip


def _tag(text: str) -> QLabel:
    """태그 — rounded-full bg-white/60 px-1.5 py-0.5 text-[11px] text-neutral-600."""
    tag = QLabel(text)
    tag.setStyleSheet(
        f"color: {N600}; {fs(11)} padding: {sp(0.5)}px {sp(1.5)}px; border: none; border-radius: 10px; background: rgba(255,255,255,0.6);"
    )
    return tag


def _card_style(color: str) -> str:
    # 웹: rounded-lg border border-neutral-200/60 + 방 색의 옅은 바탕(palette.card), hover 시 neutral-300
    return (
        f"QFrame#card {{ background: {palette_card(color)}; border: 1px solid rgba(229,229,229,0.6); border-radius: {RADIUS['lg']}px; }}"
        "QFrame#card:hover { border: 1px solid #D4D4D4; }"
    )


class RoomCard(QFrame):
    """전체/추천 방 카드 — 방 이름·참여 인원, 공개/비공개·입장 직업, 누적/이번 달 글자수, 태그, [입장하기]."""

    open_room = Signal(object)  # 내가 이미 들어간 방을 연다
    join_room = Signal(object)  # [입장하기]

    def __init__(self, room: RoomItem, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._room = room
        self.setObjectName("card")
        self.setStyleSheet(_card_style(room.color))
        self.setCursor(Qt.PointingHandCursor if room.is_member else Qt.ArrowCursor)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(sp(4), sp(4), sp(4), sp(4))  # p-4
        lay.setSpacing(sp(2))  # gap-2

        head = QHBoxLayout()
        head.setSpacing(sp(1.5))
        dot = QLabel("●")
        dot.setStyleSheet(f"color: {palette_dot(room.color)}; {fs(8)} {_FLAT}")
        name = QLabel(room.name)
        name.setStyleSheet(f"{fs('sm')} {_FLAT}")
        name.setWordWrap(True)
        count = QLabel(f"{room.member_count}명 참여중")
        count.setStyleSheet(f"color: {N500}; {fs('xs')} {_FLAT}")
        head.addWidget(dot, 0, Qt.AlignVCenter)
        head.addWidget(name, 1)
        head.addWidget(count, 0, Qt.AlignTop)
        lay.addLayout(head)

        chips = QWidget()
        chips.setStyleSheet(_FLAT)
        chips_lay = FlowLayout(chips, sp(3), sp(1))
        chips_lay.addWidget(_chip("비공개방" if room.join_type == "invite" else "공개방"))
        if room.target_position:
            chips_lay.addWidget(_chip("웹툰 작가만" if room.target_position == "webtoon" else "웹소설 작가만"))
        lay.addWidget(chips)

        counts = QHBoxLayout()
        counts.setSpacing(sp(3))
        for text in (f"누적 {room.all_time_chars:,}자", f"이번 달 {room.month_chars:,}자"):
            label = QLabel(text)
            label.setStyleSheet(f"color: {N600}; {fs(12)} {_FLAT}")
            counts.addWidget(label)
        counts.addStretch(1)
        lay.addLayout(counts)

        if room.tags:
            tags = QWidget()
            tags.setStyleSheet(_FLAT)
            tags_lay = FlowLayout(tags, sp(1), sp(1))
            for tag in room.tags:
                tags_lay.addWidget(_tag(tag))
            lay.addWidget(tags)

        if not room.is_member and room.join_type == "open":
            row = QHBoxLayout()
            row.addStretch(1)
            self._join = QPushButton("입장하기")
            self._join.setCursor(Qt.PointingHandCursor)
            self._join.setStyleSheet(
                f"QPushButton {{ background: #171717; color: white; border: none; border-radius: {RADIUS['md']}px;"
                f" padding: {sp(1.5)}px {sp(3)}px; {fs('xs')} }}"
                "QPushButton:hover { background: #404040; } QPushButton:disabled { background: #737373; }"
            )
            self._join.clicked.connect(lambda: self.join_room.emit(self._room))
            row.addWidget(self._join)
            lay.addLayout(row)

    def set_joining(self, joining: bool) -> None:
        if hasattr(self, "_join"):
            self._join.setEnabled(not joining)
            self._join.setText("입장 중..." if joining else "입장하기")

    def mouseReleaseEvent(self, event) -> None:  # noqa: N802
        if event.button() == Qt.LeftButton and self._room.is_member:
            self.open_room.emit(self._room)
        super().mouseReleaseEvent(event)


class MyRoomCard(QFrame):
    """"내가 입장한 방"의 작은 카드 — 이름·태그(최대 3)·인원, 오른쪽 위 ⭐ 즐겨찾기. (px-3 py-2.5 gap-1.5, pr-8)"""

    open_room = Signal(object)
    toggle_favorite = Signal(object, bool)

    def __init__(self, room: RoomItem, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._room = room
        self.setObjectName("card")
        self.setStyleSheet(_card_style(room.color))
        self.setCursor(Qt.PointingHandCursor)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(sp(3), sp(2.5), sp(3), sp(2.5))
        lay.setSpacing(sp(1.5))

        top = QHBoxLayout()
        top.setSpacing(sp(1.5))
        dot = QLabel("●")
        dot.setStyleSheet(f"color: {palette_dot(room.color)}; {fs(8)} {_FLAT}")
        name = QLabel(room.name)
        name.setStyleSheet(f"{fs('sm')} {_FLAT}")
        star = QPushButton("⭐" if room.is_favorite else "☆")
        star.setFlat(True)
        star.setCursor(Qt.PointingHandCursor)
        star.setToolTip("즐겨찾기 해제" if room.is_favorite else "즐겨찾기 추가")
        star.setStyleSheet(f"{_FLAT} color: #F59E0B; {fs('base')} padding: 0 2px;")
        star.clicked.connect(lambda: self.toggle_favorite.emit(self._room, not self._room.is_favorite))
        top.addWidget(dot)
        top.addWidget(name, 1)
        top.addWidget(star)
        lay.addLayout(top)

        bottom = QHBoxLayout()
        bottom.setSpacing(sp(1.5))
        for tag in room.tags[:3]:
            bottom.addWidget(_tag(tag))
        bottom.addStretch(1)
        members = QLabel(f"{room.member_count}명")
        members.setStyleSheet(f"color: {N500}; {fs(12)} {_FLAT}")
        bottom.addWidget(members)
        lay.addLayout(bottom)

    def mouseReleaseEvent(self, event) -> None:  # noqa: N802
        if event.button() == Qt.LeftButton:
            self.open_room.emit(self._room)
        super().mouseReleaseEvent(event)


__all__ = ["RoomCard", "MyRoomCard", "N400", "N700"]
