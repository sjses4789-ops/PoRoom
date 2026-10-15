"""메인 창 — 왼쪽 메뉴([포룸] [피드] [도전] [랭킹] [휴식] [개인]) + 위 줄 + 화면 전환."""
from __future__ import annotations

import webbrowser

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QButtonGroup,
    QFrame,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QPushButton,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from ..context import AppContext
from . import theme
from .home_page import HomePage
from .room_page import RoomPage
from .widgets import Avatar, run_async

NAV = [
    ("home", "🏠  포룸", ""),
    ("feed", "📰  피드", "/feed"),
    ("compete", "🏆  도전", "/compete"),
    ("ranking", "📊  랭킹", "/ranking"),
    ("rest", "☕  휴식", "/rest"),
    ("me", "🙂  개인", "/me"),
]


class ComingSoon(QWidget):
    """아직 데스크탑 프로그램에 만들지 않은 화면 — 웹의 같은 화면으로 바로 갈 수 있게 한다."""

    def __init__(self, title: str, web_url: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("page")
        lay = QVBoxLayout(self)
        lay.setAlignment(Qt.AlignCenter)
        head = QLabel(f"{title} 화면은 곧 만들어져요")
        head.setObjectName("title")
        head.setAlignment(Qt.AlignCenter)
        body = QLabel("지금은 웹에서 같은 화면을 쓸 수 있어요.")
        body.setObjectName("sub")
        body.setAlignment(Qt.AlignCenter)
        btn = QPushButton("웹에서 열기")
        btn.clicked.connect(lambda: webbrowser.open(web_url))
        lay.addWidget(head)
        lay.addWidget(body)
        lay.addSpacing(10)
        lay.addWidget(btn, 0, Qt.AlignHCenter)


class MainWindow(QMainWindow):
    def __init__(self, ctx: AppContext, on_sign_out) -> None:
        super().__init__()
        self._ctx = ctx
        self._on_sign_out = on_sign_out
        self._room_page: RoomPage | None = None
        self.setWindowTitle("PoRoom(포룸)")
        self.resize(1180, 760)
        self.setMinimumSize(900, 600)

        root = QWidget()
        root.setObjectName("root")
        self.setCentralWidget(root)
        outer = QHBoxLayout(root)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(0)

        outer.addWidget(self._build_sidebar())

        right = QVBoxLayout()
        right.setContentsMargins(0, 0, 0, 0)
        right.setSpacing(0)
        right.addWidget(self._build_topbar())
        self._stack = QStackedWidget()
        right.addWidget(self._stack, 1)
        wrap = QWidget()
        wrap.setLayout(right)
        outer.addWidget(wrap, 1)

        self._pages: dict[str, QWidget] = {}
        home = HomePage(ctx)
        home.open_room.connect(self.open_room)
        self._add_page("home", home)
        for key, label, path in NAV[1:]:
            title = label.split("  ")[1]
            self._add_page(key, ComingSoon(title, f"{ctx.config.web_url}{path}"))
        self._nav_buttons["home"].setChecked(True)
        self._stack.setCurrentWidget(self._pages["home"])

    # ── 구성 ───────────────────────────────────────────────────
    def _build_sidebar(self) -> QWidget:
        side = QWidget()
        side.setObjectName("sidebar")
        side.setFixedWidth(190)
        lay = QVBoxLayout(side)
        lay.setContentsMargins(14, 18, 14, 18)
        lay.setSpacing(4)
        logo = QLabel("PoRoom")
        logo.setStyleSheet(f"font-size: 22px; font-weight: 800; color: {theme.BRAND}; padding: 0 6px 12px 6px;")
        lay.addWidget(logo)
        self._nav_group = QButtonGroup(self)
        self._nav_group.setExclusive(True)
        self._nav_buttons: dict[str, QPushButton] = {}
        for key, label, _path in NAV:
            btn = QPushButton(label)
            btn.setObjectName("nav")
            btn.setCheckable(True)
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda _checked, k=key: self.show_page(k))
            self._nav_group.addButton(btn)
            self._nav_buttons[key] = btn
            lay.addWidget(btn)
        lay.addStretch(1)
        out = QPushButton("로그아웃")
        out.clicked.connect(self._on_sign_out)
        lay.addWidget(out)
        return side

    def _build_topbar(self) -> QWidget:
        bar = QWidget()
        bar.setObjectName("topbar")
        bar.setFixedHeight(56)
        lay = QHBoxLayout(bar)
        lay.setContentsMargins(20, 0, 16, 0)
        lay.addStretch(1)
        for icon, tip in (("🔔", "알림"), ("✉️", "우편함")):
            btn = QPushButton(icon)
            btn.setObjectName("icon")
            btn.setToolTip(f"{tip}은 곧 만들어져요")
            btn.setEnabled(False)
            lay.addWidget(btn)
        name = QLabel(self._ctx.profile.name or "")
        name.setStyleSheet("font-weight: 700;")
        avatar = Avatar(34)
        lay.addWidget(name)
        lay.addWidget(avatar)
        cid = self._ctx.profile.character_id
        if cid:
            repo = self._ctx.repo
            run_async(self, lambda: repo.character_bytes(cid), lambda data, err: avatar.set_png(data if isinstance(data, bytes) else None))
        return bar

    def _add_page(self, key: str, page: QWidget) -> None:
        self._pages[key] = page
        self._stack.addWidget(page)

    # ── 화면 전환 ──────────────────────────────────────────────
    def show_page(self, key: str) -> None:
        if self._room_page is not None and key == "home":
            self._close_room()
        self._nav_buttons[key].setChecked(True)
        self._stack.setCurrentWidget(self._pages[key])

    def open_room(self, room_id: str) -> None:
        if self._room_page is not None:
            self._close_room()
        page = RoomPage(self._ctx, room_id)
        page.back.connect(self._on_room_back)
        self._room_page = page
        self._stack.addWidget(page)
        self._stack.setCurrentWidget(page)
        self._nav_buttons["home"].setChecked(True)

    def _on_room_back(self) -> None:
        self._close_room()
        self._stack.setCurrentWidget(self._pages["home"])
        home = self._pages["home"]
        if isinstance(home, HomePage):
            home.refresh()

    def _close_room(self) -> None:
        page = self._room_page
        if page is None:
            return
        page.close_room()
        self._stack.removeWidget(page)
        page.deleteLater()
        self._room_page = None

    def closeEvent(self, event) -> None:  # noqa: N802
        self._close_room()
        self._ctx.pomodoro.flush_pending()
        super().closeEvent(event)


__all__ = ["MainWindow", "QFrame"]
