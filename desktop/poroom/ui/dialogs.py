"""[포룸]의 팝업들 — 닉네임 고르기, 새 방 만들기, 초대코드로 입장, 할 일 기록(+더보기). 문구·순서는 웹과 같다."""
from __future__ import annotations

from datetime import datetime, timedelta

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QButtonGroup,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from ..models import NicknameContext, TodoHistoryItem, today_kst
from ..palette import PALETTE
from ..repo import RepositoryProtocol
from ..tags import ROOM_TAGS
from .layouts import FlowLayout
from .popup import Popup
from .widgets import DotRadio, run_async

MAX_EXTRA_NICKNAMES = 2

LABEL_STYLE = "color: #737373; font-size: 12px; font-weight: 500;"
RADIO_STYLE = (
    "QRadioButton { font-size: 12px; spacing: 6px; }"
    "QRadioButton::indicator { width: 14px; height: 14px; border-radius: 8px; border: 1px solid #A3A3A3; background: white; }"
    "QRadioButton::indicator:checked { border: 4px solid #171717; background: white; }"
)


def _title_row(popup: Popup, text: str, closable: bool = True) -> QLabel:
    row = QHBoxLayout()
    title = QLabel(text)
    title.setStyleSheet("font-size: 13px; font-weight: 600;")
    row.addWidget(title, 1)
    if closable:
        close = QPushButton("✕")
        close.setFlat(True)
        close.setCursor(Qt.PointingHandCursor)
        close.setStyleSheet("border: none; color: #A3A3A3; padding: 0 4px; background: transparent;")
        close.clicked.connect(popup.reject)
        row.addWidget(close)
    popup.body.addLayout(row)
    return title


class Chip(QPushButton):
    """둥근 알약 모양 선택 칩(웹의 rounded-full border px-2 py-0.5 text-[12px]) — 선택되면 검정."""

    def __init__(self, text: str, checkable: bool = True, parent: QWidget | None = None) -> None:
        super().__init__(text, parent)
        self.setCheckable(checkable)
        self.setCursor(Qt.PointingHandCursor)
        self.setStyleSheet(
            "QPushButton { border: 1px solid #E5E5E5; border-radius: 10px; padding: 2px 9px; font-size: 12px;"
            " color: #525252; background: white; font-weight: 400; }"
            "QPushButton:hover { background: #FAFAFA; }"
            "QPushButton:checked { background: #171717; color: white; border: 1px solid #171717; }"
        )


# ── 닉네임 고르기 ────────────────────────────────────────────────
class NicknameDialog(Popup):
    """이 방에서 쓸 닉네임 고르기(입장 전). result_id: 고른 닉네임 id(기본이면 None), accepted()면 고른 것."""

    def __init__(self, parent: QWidget | None, ctx: NicknameContext, repo: RepositoryProtocol) -> None:
        super().__init__(parent, 384)
        self._repo = repo
        self._nicknames = list(ctx.nicknames)
        self._default_name = ctx.default_name
        self.result_id: str | None = None
        self._pending = False
        _title_row(self, "이 방에서 쓸 닉네임")
        self._content = QVBoxLayout()
        self._content.setSpacing(8)
        self.body.addLayout(self._content)
        self._show_first()

    def _clear(self) -> None:
        while self._content.count():
            item = self._content.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
            elif item.layout():
                lay = item.layout()
                while lay.count():
                    sub = lay.takeAt(0)
                    if sub.widget():
                        sub.widget().deleteLater()

    def _wrap_label(self, text: str, style: str = "") -> QLabel:
        label = QLabel(text)
        label.setWordWrap(True)
        if style:
            label.setStyleSheet(style)
        return label

    def _dark_button(self, text: str, outline: bool = False) -> QPushButton:
        btn = QPushButton(text)
        btn.setCursor(Qt.PointingHandCursor)
        if not outline:
            btn.setObjectName("dark")
        return btn

    def _show_first(self) -> None:
        self._clear()
        self._content.addWidget(self._wrap_label(f'이 방에서 기본 닉네임 "{self._default_name}"을(를) 사용할까요?', "font-size: 13px; color: #525252;"))
        self._content.addWidget(self._wrap_label("여기서 고른 닉네임은 이 방에서만 쓰이고, 다른 방에는 영향이 없어요.", "font-size: 12px; color: #A3A3A3;"))
        use_default = self._dark_button("기본 닉네임 사용")
        use_default.clicked.connect(lambda: self._choose(None))
        other = self._dark_button("다른 닉네임 사용", outline=True)
        other.clicked.connect(self._show_other)
        self._content.addWidget(use_default)
        self._content.addWidget(other)

    def _show_other(self) -> None:
        self._clear()
        self._content.addWidget(
            self._wrap_label(
                f"이 방에서만 쓸 다른 닉네임을 고르거나 새로 만드세요. 닉네임은 기본 닉네임을 포함해 총 {MAX_EXTRA_NICKNAMES + 1}개까지 만들 수 있어요.",
                "font-size: 12px; color: #737373;",
            )
        )
        for nid, name in self._nicknames:
            btn = QPushButton(name)
            btn.setCursor(Qt.PointingHandCursor)
            btn.setStyleSheet("text-align: left; padding: 8px 12px; font-size: 12px;")
            btn.clicked.connect(lambda _c=False, i=nid: self._choose(i))
            self._content.addWidget(btn)
        if len(self._nicknames) < MAX_EXTRA_NICKNAMES:
            row = QHBoxLayout()
            self._input = QLineEdit()
            self._input.setPlaceholderText("새 닉네임")
            self._input.setMaxLength(20)
            self._input.returnPressed.connect(self._create_and_use)
            create = self._dark_button("만들고 사용")
            create.clicked.connect(self._create_and_use)
            row.addWidget(self._input, 1)
            row.addWidget(create)
            self._content.addLayout(row)
        else:
            self._content.addWidget(
                self._wrap_label(f"닉네임을 이미 {MAX_EXTRA_NICKNAMES + 1}개(기본 포함) 만들었어요. 만들어 둔 닉네임 중에서 골라주세요.", "font-size: 12px; color: #A3A3A3;")
            )
        self._error = QLabel()
        self._error.setStyleSheet("color: #EF4444; font-size: 12px;")
        self._error.setWordWrap(True)
        self._content.addWidget(self._error)
        back = QPushButton("← 돌아가기")
        back.setFlat(True)
        back.setStyleSheet("border: none; color: #737373; text-align: left; padding: 2px 0; background: transparent;")
        back.clicked.connect(self._show_first)
        self._content.addWidget(back)

    def _choose(self, nickname_id: str | None) -> None:
        self.result_id = nickname_id
        self.accept()

    def _create_and_use(self) -> None:
        name = self._input.text().strip()
        if not name or self._pending:
            return
        self._pending = True

        def done(result: object, err: Exception | None) -> None:
            self._pending = False
            if err is None and isinstance(result, tuple):
                self._nicknames.append(result)
                self._choose(result[0])
            else:
                self._error.setText(str(result) if isinstance(result, str) else "닉네임을 만들지 못했어요.")

        run_async(self, lambda: self._repo.create_nickname(name), done)


# ── 새 방 만들기 ─────────────────────────────────────────────────
class CreateRoomDialog(Popup):
    """새 방 만들기 폼(웹의 create-room-button 팝업과 같은 항목·순서). 확인하면 values에 값이 담긴다."""

    def __init__(self, parent: QWidget | None) -> None:
        super().__init__(parent, 320)
        self.values: dict = {}
        self._color = PALETTE[0][0]
        self._tags: set[str] = set()

        self._name = QLineEdit()
        self._name.setPlaceholderText("방 이름")
        self.body.addWidget(self._name)

        self.body.addWidget(self._label("방 색상"))
        self._color_buttons: dict[str, QPushButton] = {}
        flow_host = QWidget()
        flow = FlowLayout(flow_host, 6, 6)
        for key, label, dot, _bg in PALETTE:
            btn = QPushButton()
            btn.setFixedSize(24, 24)
            btn.setToolTip(label)
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda _c=False, k=key: self._pick_color(k))
            self._color_buttons[key] = btn
            flow.addWidget(btn)
        flow_host.setMinimumHeight(flow.heightForWidth(284))
        self.body.addWidget(flow_host)
        self._pick_color(self._color)

        self.body.addWidget(self._label("태그"))
        tag_scroll = QScrollArea()
        tag_scroll.setWidgetResizable(True)
        tag_scroll.setFixedHeight(128)
        tag_host = QWidget()
        tag_host.setObjectName("taghost")
        tag_host.setStyleSheet("QWidget#taghost { background: white; }")
        tag_scroll.setStyleSheet("QScrollArea { background: white; border: none; }")
        tag_scroll.viewport().setStyleSheet("background: white;")
        tag_flow = FlowLayout(tag_host, 6, 6)
        for tag in ROOM_TAGS:
            chip = Chip(tag)
            chip.toggled.connect(lambda on, t=tag: (self._tags.add(t) if on else self._tags.discard(t)))
            tag_flow.addWidget(chip)
        tag_host.setMinimumHeight(tag_flow.heightForWidth(262))
        tag_scroll.setWidget(tag_host)
        self.body.addWidget(tag_scroll)

        self._join_group = self._radios("입장 방식", [("invite", "초대코드 입장"), ("open", "공개방")], "invite")
        self._target_group = self._radios("입장 가능 직업", [("", "누구나"), ("novelist", "웹소설 작가만"), ("webtoon", "웹툰 작가만")], "")
        self._visibility_group = self._radios(
            "기록 공개 정책",
            [("shared", "기록 공유방", "모두의 기록이 공개돼요"), ("private", "기록 비공유방", "서로의 기록이 비공개예요"), ("free", "기록 공유 자유", "각자 공개 여부를 정해요")],
            "shared",
            vertical=True,
        )

        self._error = QLabel()
        self._error.setStyleSheet("color: #EF4444; font-size: 12px;")
        self._error.setWordWrap(True)
        self.body.addWidget(self._error)
        self._submit = QPushButton("만들기")
        self._submit.setObjectName("dark")
        self._submit.setCursor(Qt.PointingHandCursor)
        self._submit.clicked.connect(self._on_submit)
        self.body.addWidget(self._submit)

    def _label(self, text: str) -> QLabel:
        label = QLabel(text)
        label.setStyleSheet(LABEL_STYLE)
        return label

    def _pick_color(self, key: str) -> None:
        self._color = key
        for k, btn in self._color_buttons.items():
            dot = next(p[2] for p in PALETTE if p[0] == k)
            if k == key:
                btn.setText("✓")
                btn.setStyleSheet(f"QPushButton {{ background: {dot}; border-radius: 12px; border: 2px solid #171717; color: white; font-size: 11px; padding: 0; }}")
            else:
                btn.setText("")
                btn.setStyleSheet(f"QPushButton {{ background: {dot}; border-radius: 12px; border: none; }} QPushButton:hover {{ border: 1px solid #171717; }}")

    def _radios(self, title: str, options: list[tuple], default: str, vertical: bool = False) -> QButtonGroup:
        self.body.addWidget(self._label(title))
        group = QButtonGroup(self)
        host = QWidget()
        lay = QVBoxLayout(host) if vertical else QHBoxLayout(host)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(4 if vertical else 12)
        for opt in options:
            value, label = opt[0], opt[1]
            radio = DotRadio(label)
            radio.setProperty("value", value)
            radio.setChecked(value == default)
            group.addButton(radio)
            if len(opt) > 2:
                row = QHBoxLayout()
                row.setSpacing(6)
                row.addWidget(radio)
                hint = QLabel(opt[2])
                hint.setStyleSheet("color: #A3A3A3; font-size: 12px;")
                row.addWidget(hint)
                row.addStretch(1)
                lay.addLayout(row)
            else:
                lay.addWidget(radio)
        if not vertical:
            lay.addStretch(1)
        self.body.addWidget(host)
        return group

    @staticmethod
    def _checked_value(group: QButtonGroup) -> str:
        btn = group.checkedButton()
        return str(btn.property("value")) if btn is not None else ""

    def _on_submit(self) -> None:
        name = self._name.text().strip()
        if not name:
            self._error.setText("방 이름을 입력해 주세요.")
            return
        self.values = {
            "name": name,
            "color": self._color,
            "tags": [t for t in ROOM_TAGS if t in self._tags],
            "join_type": self._checked_value(self._join_group),
            "target_position": self._checked_value(self._target_group),
            "record_visibility": self._checked_value(self._visibility_group),
        }
        self.accept()

    def show_error(self, text: str) -> None:
        self._error.setText(text)


# ── 초대코드로 입장 ───────────────────────────────────────────────
class InviteCodeDialog(Popup):
    def __init__(self, parent: QWidget | None) -> None:
        super().__init__(parent, 256)
        self.code = ""
        self._input = QLineEdit()
        self._input.setPlaceholderText("초대코드 입력")
        self._input.setMaxLength(6)
        self._input.setStyleSheet("text-transform: uppercase;")
        self._input.returnPressed.connect(self._submit)
        self.body.addWidget(self._input)
        self._error = QLabel()
        self._error.setStyleSheet("color: #EF4444; font-size: 12px;")
        self._error.setWordWrap(True)
        self.body.addWidget(self._error)
        btn = QPushButton("입장하기")
        btn.setObjectName("dark")
        btn.setCursor(Qt.PointingHandCursor)
        btn.clicked.connect(self._submit)
        self.body.addWidget(btn)

    def _submit(self) -> None:
        code = self._input.text().strip().upper()
        if not code:
            self._error.setText("초대코드를 입력해 주세요.")
            return
        self.code = code
        self.accept()

    def show_error(self, text: str) -> None:
        self._error.setText(text)


# ── 할 일 기록(+ 더보기) ──────────────────────────────────────────
class TodoHistoryDialog(Popup):
    def __init__(self, parent: QWidget | None, repo: RepositoryProtocol) -> None:
        super().__init__(parent, 352)
        self._repo = repo
        self._date = today_kst()
        self._cache: dict[str, list[TodoHistoryItem]] = {}

        head = QHBoxLayout()
        prev_btn = QPushButton("←")
        prev_btn.setFlat(True)
        prev_btn.setCursor(Qt.PointingHandCursor)
        prev_btn.setStyleSheet("border: none; color: #737373; padding: 2px 8px; background: transparent;")
        prev_btn.clicked.connect(lambda: self._shift(-1))
        self._title = QLabel(self._date)
        self._title.setAlignment(Qt.AlignCenter)
        self._title.setStyleSheet("font-size: 13px; font-weight: 600;")
        next_btn = QPushButton("→")
        next_btn.setFlat(True)
        next_btn.setCursor(Qt.PointingHandCursor)
        next_btn.setStyleSheet("border: none; color: #737373; padding: 2px 8px; background: transparent;")
        next_btn.clicked.connect(lambda: self._shift(1))
        head.addWidget(prev_btn)
        head.addWidget(self._title, 1)
        head.addWidget(next_btn)
        self.body.addLayout(head)

        self._list = QVBoxLayout()
        self._list.setSpacing(6)
        self.body.addLayout(self._list)
        close = QPushButton("닫기")
        close.setCursor(Qt.PointingHandCursor)
        close.clicked.connect(self.reject)
        row = QHBoxLayout()
        row.addStretch(1)
        row.addWidget(close)
        self.body.addLayout(row)
        self._load()

    def _shift(self, days: int) -> None:
        d = datetime.strptime(self._date, "%Y-%m-%d") + timedelta(days=days)
        self._date = d.strftime("%Y-%m-%d")
        self._title.setText(self._date)
        self._load()

    def _clear(self) -> None:
        while self._list.count():
            item = self._list.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

    def _load(self) -> None:
        date = self._date
        if date in self._cache:
            self._render(self._cache[date])
            return
        self._clear()
        loading = QLabel("···")
        loading.setAlignment(Qt.AlignCenter)
        loading.setStyleSheet("color: #A3A3A3; padding: 10px;")
        self._list.addWidget(loading)

        def done(result: object, err: Exception | None) -> None:
            if err is not None or not isinstance(result, list):
                return
            self._cache[date] = result
            if date == self._date:
                self._render(result)

        run_async(self, lambda: self._repo.todos_for_date(date), done)

    def _render(self, items: list[TodoHistoryItem]) -> None:
        self._clear()
        if not items:
            empty = QLabel("이 날짜엔 할 일이 없어요.")
            empty.setAlignment(Qt.AlignCenter)
            empty.setStyleSheet("color: #A3A3A3; font-size: 12px; padding: 12px;")
            self._list.addWidget(empty)
            return
        for item in items:
            row = QHBoxLayout()
            row.setSpacing(8)
            box = QPushButton("✓" if item.completed else "")
            box.setFixedSize(16, 16)
            box.setCursor(Qt.PointingHandCursor)
            self._style_box(box, item.completed)
            box.clicked.connect(lambda _c=False, it=item, b=box: self._toggle(it, b))
            text = QLabel(item.content)
            text.setStyleSheet(
                "font-size: 12px; color: #A3A3A3; text-decoration: line-through;" if item.completed else "font-size: 12px; color: #404040;"
            )
            row.addWidget(box)
            row.addWidget(text, 1)
            holder = QWidget()
            holder.setLayout(row)
            self._list.addWidget(holder)

    @staticmethod
    def _style_box(box: QPushButton, completed: bool) -> None:
        if completed:
            box.setStyleSheet("QPushButton { background: #10B981; border: 1px solid #10B981; border-radius: 8px; color: white; font-size: 10px; padding: 0; }")
        else:
            box.setStyleSheet("QPushButton { background: white; border: 1px solid #D4D4D4; border-radius: 8px; padding: 0; } QPushButton:hover { border-color: #A3A3A3; }")

    def _toggle(self, item: TodoHistoryItem, box: QPushButton) -> None:
        item.completed = not item.completed
        box.setText("✓" if item.completed else "")
        self._style_box(box, item.completed)
        completed, todo_id = item.completed, item.id
        run_async(self, lambda: self._repo.set_todo_completed(todo_id, completed), lambda *_: None)
        self._render(self._cache.get(self._date, []))


__all__ = ["CreateRoomDialog", "InviteCodeDialog", "NicknameDialog", "TodoHistoryDialog", "Chip", "Signal"]
