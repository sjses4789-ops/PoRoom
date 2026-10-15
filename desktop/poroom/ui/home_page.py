"""[포룸] 홈 — 웹 [포룸] 페이지와 같은 구성: 내 현황(대시보드) · 마감방/새벽방 · 내가 입장한 방 · 전체/추천 방(필터·검색·정렬)."""
from __future__ import annotations

from PySide6.QtCore import QTimer, Qt, Signal
from PySide6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from ..context import AppContext
from ..models import HomeData, RoomItem
from ..tags import ROOM_TAGS
from .dashboard import DashboardPanel
from .dialogs import Chip, CreateRoomDialog, InviteCodeDialog, NicknameDialog
from .layouts import FlowLayout, MasonryColumns
from .room_cards import MyRoomCard, RoomCard
from .scale import N400, N500, N700, RADIUS, fs, sp
from .widgets import run_async

SORT_OPTIONS = [("chars", "누적 글자순"), ("members", "모임 인원순"), ("created", "생성 날짜순")]


class SystemRoomCard(QFrame):
    """마감방/새벽방 카드 — 웹의 systemRoomSection 두 칸."""

    clicked = Signal(str)

    def __init__(self, kind: str, label: str, emoji: str, bg: str, button_bg: str, hover_bg: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._kind = kind
        self._label_text = label
        self._emoji = emoji
        self.setStyleSheet(
            f"SystemRoomCard {{ background: {bg}; border: 1px solid rgba(229,229,229,0.6); border-radius: {RADIUS['lg']}px; }}"
        )
        lay = QVBoxLayout(self)
        lay.setContentsMargins(sp(3), sp(4), sp(3), sp(4))  # px-3 py-4
        lay.setSpacing(sp(3))  # gap-3
        texts = QVBoxLayout()
        texts.setSpacing(sp(1))
        title = QLabel(label)
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet(f"{fs('sm')} border: none; background: transparent;")
        self._hint = QLabel()
        self._hint.setAlignment(Qt.AlignCenter)
        self._hint.setStyleSheet(f"color: {N500}; {fs(11)} border: none; background: transparent;")
        texts.addWidget(title)
        texts.addWidget(self._hint)
        lay.addLayout(texts)
        self._button = QPushButton()
        self._button.setCursor(Qt.PointingHandCursor)
        self._button.setStyleSheet(
            f"QPushButton {{ background: {button_bg}; color: white; border: none; border-radius: {RADIUS['md']}px; padding: {sp(2)}px {sp(3)}px; {fs('sm')} }}"
            f"QPushButton:hover {{ background: {hover_bg}; }} QPushButton:disabled {{ background: {button_bg}; color: rgba(255,255,255,0.6); }}"
        )
        self._button.clicked.connect(lambda: self.clicked.emit(self._kind))
        lay.addWidget(self._button)
        self.set_count(0, 50)

    def set_count(self, count: int, capacity: int) -> None:
        self._hint.setText(f"정원 {capacity}명 · 상시 오픈방")
        self._button.setText(f"{self._emoji} {self._label_text} 입장   {count}/{capacity}")

    def set_pending(self, pending: bool) -> None:
        self._button.setEnabled(not pending)


class HomePage(QWidget):
    open_room = Signal(str)

    def __init__(self, ctx: AppContext, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("page")
        self._ctx = ctx
        self._data: HomeData | None = None
        self._busy = False
        self._first_render = True
        # 필터/정렬/검색 상태(웹의 MainRoomLists와 같다)
        self._join_filter: str | None = None
        self._target_filter: str | None = None
        self._tag_filter: set[str] = set()
        self._search_open = False
        self._applied_search = ""
        self._sort_mode = "chars"
        self._sort_desc = True

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        outer.addWidget(scroll)
        body = QWidget()
        body.setObjectName("page")
        scroll.setWidget(body)
        # 웹: <main px-8 py-8> 안에 mx-auto max-w-6xl(72rem = 1224px) — 가운데 정렬된 한 칸
        outer_row = QHBoxLayout(body)
        outer_row.setContentsMargins(sp(8), sp(8), sp(8), sp(8))
        content = QWidget()
        content.setObjectName("page")
        content.setMaximumWidth(round(72 * 17))
        outer_row.addStretch(1)
        outer_row.addWidget(content, 100)
        outer_row.addStretch(1)
        self._root = QVBoxLayout(content)
        self._root.setContentsMargins(0, 0, 0, 0)
        self._root.setSpacing(sp(10))  # flex-col gap-10

        # 위: 내 현황 | 마감방·새벽방(고정 폭 220)
        self._top = QHBoxLayout()
        self._top.setSpacing(sp(6))  # gap-6
        self._dashboard_slot = QVBoxLayout()
        self._dashboard_slot.setContentsMargins(0, 0, 0, 0)
        self._top.addLayout(self._dashboard_slot, 1)
        sys_col = QVBoxLayout()
        sys_col.setSpacing(sp(3))  # gap-3
        self._deadline = SystemRoomCard("deadline", "마감방", "🔥", "#FAF3F3", "#A86363", "#966161")
        self._dawn = SystemRoomCard("dawn", "새벽방", "🌛", "#F2F3F9", "#5F6D97", "#556087")
        self._deadline.clicked.connect(self._enter_system)
        self._dawn.clicked.connect(self._enter_system)
        sys_col.addWidget(self._deadline)
        sys_col.addWidget(self._dawn)
        sys_col.addStretch(1)
        sys_host = QWidget()
        sys_host.setFixedWidth(220)
        sys_host.setLayout(sys_col)
        sys_col.setContentsMargins(0, 0, 0, 0)
        self._top.addWidget(sys_host, 0, Qt.AlignTop)
        self._root.addLayout(self._top)

        # 아래: 내가 입장한 방(260) | 전체/추천 방
        bottom = QHBoxLayout()
        bottom.setSpacing(sp(6))  # gap-6
        bottom.setAlignment(Qt.AlignTop)
        bottom.addWidget(self._build_my_rooms(), 0, Qt.AlignTop)
        bottom.addWidget(self._build_all_rooms(), 1, Qt.AlignTop)
        self._root.addLayout(bottom)
        self._root.addStretch(1)

        self._status = QLabel("불러오는 중...")
        self._status.setObjectName("muted")
        self._root.insertWidget(0, self._status)

        self.refresh()
        self._timer = QTimer(self)
        self._timer.setInterval(30_000)
        self._timer.timeout.connect(self.refresh)
        self._timer.start()

    # ── 구성 ───────────────────────────────────────────────────
    def _build_my_rooms(self) -> QWidget:
        host = QWidget()
        host.setFixedWidth(260)
        lay = QVBoxLayout(host)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(sp(3))
        heading = QLabel("내가 입장한 방")
        heading.setStyleSheet(f"{fs('sm')} font-weight: 700;")
        lay.addWidget(heading)
        buttons = QHBoxLayout()
        buttons.setSpacing(sp(1.5))
        for text, slot in (("새 방 만들기", self._create_room), ("초대코드로 입장", self._join_by_code)):
            btn = QPushButton(text)
            btn.setCursor(Qt.PointingHandCursor)
            btn.setStyleSheet(
                f"QPushButton {{ border: 1px solid #E5E5E5; border-radius: {RADIUS['md']}px; padding: {sp(1.5)}px {sp(3)}px; {fs('xs')} color: {N700}; background: white; }}"
                "QPushButton:hover { background: #FAFAFA; }"
            )
            btn.clicked.connect(slot)
            buttons.addWidget(btn)
        buttons.addStretch(1)
        lay.addLayout(buttons)
        self._my_list = QVBoxLayout()
        self._my_list.setSpacing(sp(2))
        lay.addLayout(self._my_list)
        lay.addStretch(1)
        return host

    def _build_all_rooms(self) -> QWidget:
        host = QWidget()
        lay = QVBoxLayout(host)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(sp(3))

        self._filter_host = QWidget()
        self._filter_flow = FlowLayout(self._filter_host, sp(1.5), sp(1.5))
        lay.addWidget(self._filter_host)
        self._build_filters()

        header = QHBoxLayout()
        header.setSpacing(sp(1.5))
        heading = QLabel("전체 / 추천 방")
        heading.setStyleSheet(f"{fs('sm')} font-weight: 700;")
        header.addWidget(heading)
        self._search_btn = QPushButton("🔍")
        self._search_btn.setFixedSize(sp(5), sp(5))  # h-5 w-5
        self._search_btn.setCursor(Qt.PointingHandCursor)
        self._search_btn.setToolTip("방 이름 검색")
        self._search_btn.clicked.connect(self._toggle_search)
        header.addWidget(self._search_btn)
        self._search = QLineEdit()
        self._search.setPlaceholderText("방 이름 검색 후 Enter")
        self._search.setFixedWidth(sp(48))  # w-48
        self._search.setStyleSheet(f"border-radius: 11px; padding: {sp(0.5)}px {sp(2.5)}px; {fs(12)} color: {N700};")
        self._search.returnPressed.connect(self._apply_search)
        self._search.hide()
        header.addWidget(self._search)
        header.addStretch(1)
        self._sort_buttons: dict[str, QPushButton] = {}
        for key, label in SORT_OPTIONS:
            btn = QPushButton(label)
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda _c=False, k=key: self._sort_clicked(k))
            self._sort_buttons[key] = btn
            header.addWidget(btn)
        lay.addLayout(header)
        self._style_sort_and_search()

        self._empty = QLabel()
        self._empty.setStyleSheet(f"color: {N400}; {fs(12)}")
        lay.addWidget(self._empty)
        self._grid = MasonryColumns(gap=sp(3))
        lay.addWidget(self._grid)
        lay.addStretch(1)
        return host

    def _build_filters(self) -> None:
        while self._filter_flow.count():
            item = self._filter_flow.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        if self._join_filter or self._target_filter or self._tag_filter or self._applied_search:
            reset = QPushButton("초기화")
            reset.setCursor(Qt.PointingHandCursor)
            reset.setStyleSheet(
                f"QPushButton {{ border: 1px solid #D4D4D4; border-radius: 11px; padding: {sp(0.5)}px {sp(2)}px; {fs(12)} background: #E5E5E5; color: #525252; }}"
                "QPushButton:hover { background: #D4D4D4; }"
            )
            reset.clicked.connect(self._reset_filters)
            self._filter_flow.addWidget(reset)
        for value, label in (("open", "공개방"), ("invite", "비공개방")):
            chip = Chip(label)
            chip.setChecked(self._join_filter == value)
            chip.clicked.connect(lambda _c=False, v=value: self._set_join_filter(v))
            self._filter_flow.addWidget(chip)
        for value, label in (("novelist", "웹소설 작가만"), ("webtoon", "웹툰 작가만")):
            chip = Chip(label)
            chip.setChecked(self._target_filter == value)
            chip.clicked.connect(lambda _c=False, v=value: self._set_target_filter(v))
            self._filter_flow.addWidget(chip)
        for tag in ROOM_TAGS:
            chip = Chip(tag)
            chip.setChecked(tag in self._tag_filter)
            chip.clicked.connect(lambda _c=False, t=tag: self._toggle_tag(t))
            self._filter_flow.addWidget(chip)
        self._filter_host.updateGeometry()

    def _style_sort_and_search(self) -> None:
        for key, btn in self._sort_buttons.items():
            label = dict(SORT_OPTIONS)[key]
            active = key == self._sort_mode
            btn.setText(label + ((" ▼" if self._sort_desc else " ▲") if active else ""))
            btn.setStyleSheet(
                f"QPushButton {{ background: #171717; color: white; border: none; border-radius: {RADIUS['md']}px; padding: {sp(1)}px {sp(2)}px; {fs(12)} }}"
                if active
                else f"QPushButton {{ background: transparent; color: {N400}; border: none; border-radius: {RADIUS['md']}px; padding: {sp(1)}px {sp(2)}px; {fs(12)} }}"
                "QPushButton:hover { background: #F5F5F5; }"
            )
        self._search_btn.setStyleSheet(
            f"QPushButton {{ background: #171717; color: white; border: none; border-radius: 11px; {fs(10)} padding: 0; }}"
            if self._search_open
            else f"QPushButton {{ background: transparent; color: {N400}; border: none; border-radius: 11px; {fs(10)} padding: 0; }}"
            "QPushButton:hover { background: #F5F5F5; }"
        )

    # ── 필터·정렬·검색 ─────────────────────────────────────────
    def _set_join_filter(self, value: str) -> None:
        self._join_filter = None if self._join_filter == value else value
        self._refilter()

    def _set_target_filter(self, value: str) -> None:
        self._target_filter = None if self._target_filter == value else value
        self._refilter()

    def _toggle_tag(self, tag: str) -> None:
        if tag in self._tag_filter:
            self._tag_filter.discard(tag)
        else:
            self._tag_filter.add(tag)
        self._refilter()

    def _reset_filters(self) -> None:
        self._join_filter = self._target_filter = None
        self._tag_filter = set()
        self._close_search()
        self._refilter()

    def _toggle_search(self) -> None:
        if self._search_open:
            self._close_search()
            self._refilter()
        else:
            self._search_open = True
            self._search.show()
            self._search.setFocus()
            self._style_sort_and_search()

    def _close_search(self) -> None:
        self._search_open = False
        self._search.hide()
        self._search.clear()
        self._applied_search = ""
        self._style_sort_and_search()

    def _apply_search(self) -> None:
        self._applied_search = self._search.text().strip()
        self._refilter()

    def _sort_clicked(self, key: str) -> None:
        if self._sort_mode == key:
            self._sort_desc = not self._sort_desc
        else:
            self._sort_mode = key
            self._sort_desc = False  # 웹과 같이 다른 정렬을 고르면 오름차순부터
        self._style_sort_and_search()
        self._render_all_rooms()

    def _refilter(self) -> None:
        self._build_filters()
        self._render_all_rooms()

    # ── 데이터 ─────────────────────────────────────────────────
    def refresh(self) -> None:
        if self._busy:
            return
        self._busy = True
        run_async(self, self._ctx.repo.fetch_home, self._on_home)

    def _on_home(self, result: object, error: Exception | None) -> None:
        self._busy = False
        if error is not None or not isinstance(result, HomeData):
            if self._data is None:
                self._status.setText("불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.")
            return
        self._status.hide()
        first = self._data is None
        self._data = result
        if first:
            self._render_dashboard()
        self._deadline.set_count(result.deadline_count, result.system_capacity)
        self._dawn.set_count(result.dawn_count, result.system_capacity)
        self._render_my_rooms()
        self._render_all_rooms()

    def _render_dashboard(self) -> None:
        assert self._data is not None
        while self._dashboard_slot.count():
            item = self._dashboard_slot.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self._dashboard_slot.addWidget(DashboardPanel(self._ctx.repo, self._data.dashboard, self._data.position), 0, Qt.AlignTop)

    def _render_my_rooms(self) -> None:
        assert self._data is not None
        while self._my_list.count():
            item = self._my_list.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        mine = sorted((r for r in self._data.rooms if r.is_member), key=lambda r: not r.is_favorite)
        if not mine:
            empty = QLabel("아직 입장한 방이 없습니다. 새 방을 만들거나 초대코드로 입장해보세요.")
            empty.setWordWrap(True)
            empty.setStyleSheet(f"color: {N400}; {fs(12)}")
            self._my_list.addWidget(empty)
            return
        for room in mine:
            card = MyRoomCard(room)
            card.open_room.connect(lambda r: self.open_room.emit(r.id))
            card.toggle_favorite.connect(self._favorite)
            self._my_list.addWidget(card)

    def _filtered_rooms(self) -> list[RoomItem]:
        assert self._data is not None
        query = self._applied_search.strip().lower()
        rooms = [
            r
            for r in self._data.rooms
            if all(t in r.tags for t in self._tag_filter)
            and (self._join_filter is None or r.join_type == self._join_filter)
            and (self._target_filter is None or r.target_position == self._target_filter)
            and (not query or query in r.name.lower())
        ]
        mul = -1 if self._sort_desc else 1
        if self._sort_mode == "members":
            rooms.sort(key=lambda r: mul * r.member_count)
        elif self._sort_mode == "created":
            rooms.sort(key=lambda r: r.created_at, reverse=self._sort_desc)
        else:
            rooms.sort(key=lambda r: mul * r.all_time_chars)
        return rooms

    def _render_all_rooms(self) -> None:
        if self._data is None:
            return
        rooms = self._filtered_rooms()
        filtering = bool(self._join_filter or self._target_filter or self._tag_filter or self._applied_search)
        self._empty.setText("" if rooms else ("조건과 일치하는 방이 없습니다." if filtering else "아직 생성된 방이 없습니다."))
        cards: list[QWidget] = []
        for room in rooms:
            card = RoomCard(room)
            card.open_room.connect(lambda r: self.open_room.emit(r.id))
            card.join_room.connect(self._join_open)
            cards.append(card)
        self._grid.set_cards(cards)

    # ── 동작 ───────────────────────────────────────────────────
    def _favorite(self, room: RoomItem, favorite: bool) -> None:
        room.is_favorite = favorite
        self._render_my_rooms()
        run_async(self, lambda: self._ctx.repo.toggle_favorite(room.id, favorite), lambda *_: None)

    def _ask_nickname(self, then) -> None:  # noqa: ANN001
        """입장하기 전에 이 방에서 쓸 닉네임부터 고른다(웹과 같다). 고르면 then(nickname_id)."""

        def got(ctx: object, err: Exception | None) -> None:
            if err is not None or ctx is None:
                QMessageBox.warning(self.window(), "PoRoom", "닉네임 정보를 불러오지 못했어요.")
                return
            dialog = NicknameDialog(self, ctx, self._ctx.repo)  # type: ignore[arg-type]
            if dialog.exec_over():
                then(dialog.result_id)

        run_async(self, self._ctx.repo.nickname_context, got)

    def _enter_system(self, kind: str) -> None:
        assert self._data is not None
        is_member = self._data.deadline_member if kind == "deadline" else self._data.dawn_member
        card = self._deadline if kind == "deadline" else self._dawn

        def go(nickname_id: str | None) -> None:
            card.set_pending(True)

            def done(room_id: object, err: Exception | None) -> None:
                card.set_pending(False)
                if isinstance(room_id, str) and not room_id.startswith("error:") and err is None:
                    self.open_room.emit(room_id)
                else:
                    QMessageBox.warning(self.window(), "PoRoom", str(room_id).removeprefix("error:") if room_id else "입장하지 못했어요.")

            run_async(self, lambda: self._ctx.repo.join_system_room_with(kind, nickname_id), done)

        # 이미 들어가 있는 방이면 닉네임을 다시 묻지 않고 바로 이동한다.
        if is_member:
            go(None)
        else:
            self._ask_nickname(go)

    def _join_open(self, room: RoomItem) -> None:
        assert self._data is not None
        if room.target_position and room.target_position != self._data.position:
            QMessageBox.information(
                self.window(), "PoRoom", "웹툰 작가 전용입니다." if room.target_position == "webtoon" else "웹소설 작가 전용입니다."
            )
            return

        def go(nickname_id: str | None) -> None:
            run_async(
                self,
                lambda: self._ctx.repo.join_open_room_with(room.id, nickname_id),
                lambda ok, err: self.open_room.emit(room.id) if ok and err is None else QMessageBox.warning(self.window(), "PoRoom", "입장하지 못했어요."),
            )

        self._ask_nickname(go)

    def _create_room(self) -> None:
        dialog = CreateRoomDialog(self)
        if not dialog.exec_over():
            return
        values = dialog.values

        def go(nickname_id: str | None) -> None:
            def done(room_id: object, err: Exception | None) -> None:
                if isinstance(room_id, str) and not room_id.startswith("error:") and err is None:
                    self.open_room.emit(room_id)
                else:
                    QMessageBox.warning(self.window(), "PoRoom", str(room_id).removeprefix("error:") if room_id else "방을 만들지 못했어요.")

            run_async(
                self,
                lambda: self._ctx.repo.create_room(
                    values["name"], values["color"], values["tags"], values["join_type"], values["target_position"], values["record_visibility"], nickname_id
                ),
                done,
            )

        self._ask_nickname(go)

    def _join_by_code(self, error: str = "") -> None:
        dialog = InviteCodeDialog(self)
        if error:
            dialog.show_error(error)
        if not dialog.exec_over():
            return
        code = dialog.code

        def go(nickname_id: str | None) -> None:
            def done(room_id: object, err: Exception | None) -> None:
                if isinstance(room_id, str) and not room_id.startswith("error:") and err is None:
                    self.open_room.emit(room_id)
                else:
                    self._join_by_code(str(room_id).removeprefix("error:") if room_id else "입장하지 못했어요.")

            run_async(self, lambda: self._ctx.repo.join_room_by_code(code, nickname_id), done)

        self._ask_nickname(go)
