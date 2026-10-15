"""메인 창 — 웹 PoRoom의 헤더처럼: 로고 · 메뉴 탭([포룸][피드][도전][랭킹][휴식]) · 알림/우편함 · 내 이름 · 창 버튼."""
from __future__ import annotations

import webbrowser

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QButtonGroup,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QPushButton,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from ..context import AppContext
from .chrome import ChromeRoot, TitleBar, app_icon
from .home_page import HomePage
from .room_page import RoomPage
from .widgets import Avatar, run_async

NAV = [
    ("home", "포룸", ""),
    ("feed", "피드", "/feed"),
    ("compete", "도전", "/compete"),
    ("ranking", "랭킹", "/ranking"),
    ("rest", "휴식", "/rest"),
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
    def __init__(self, ctx: AppContext, on_sign_out, on_closed) -> None:
        super().__init__()
        self._ctx = ctx
        self._on_sign_out = on_sign_out
        self._on_closed = on_closed
        self._room_page: RoomPage | None = None
        self.setWindowFlags(Qt.Window | Qt.FramelessWindowHint)
        self.setWindowTitle("PoRoom(포룸)")
        self.setWindowIcon(app_icon())
        self.resize(1180, 780)
        self.setMinimumSize(940, 620)

        self._chrome = ChromeRoot()
        self.setCentralWidget(self._chrome)
        self._title_bar = TitleBar(self)
        self._build_header()
        self._chrome.body.addWidget(self._title_bar)

        self._stack = QStackedWidget()
        self._chrome.body.addWidget(self._stack, 1)

        self._pages: dict[str, QWidget] = {}
        home = HomePage(ctx)
        home.open_room.connect(self.open_room)
        self._add_page("home", home)
        for key, label, path in NAV[1:]:
            self._add_page(key, ComingSoon(label, f"{ctx.config.web_url}{path}"))
        self._nav_buttons["home"].setChecked(True)
        self._stack.setCurrentWidget(self._pages["home"])

    # ── 구성 ───────────────────────────────────────────────────
    def _build_header(self) -> None:
        bar = self._title_bar
        self._nav_group = QButtonGroup(self)
        self._nav_group.setExclusive(True)
        self._nav_buttons: dict[str, QPushButton] = {}
        for key, label, _path in NAV:
            btn = QPushButton(label)
            btn.setObjectName("tab")
            btn.setCheckable(True)
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda _checked, k=key: self.show_page(k))
            self._nav_group.addButton(btn)
            self._nav_buttons[key] = btn
            bar.layout_.addWidget(btn)
        bar.layout_.addStretch(1)  # 빈 곳은 끌어서 창을 옮긴다

        for icon, tip in (("🔔", "알림"), ("✉", "우편함")):
            btn = QPushButton(icon)
            btn.setObjectName("icon")
            btn.setToolTip(f"{tip}은 곧 만들어져요")
            btn.setEnabled(False)
            bar.layout_.addWidget(btn)

        self._name = QPushButton(self._ctx.profile.name or "")
        self._name.setObjectName("userlink")
        self._name.setCursor(Qt.PointingHandCursor)
        self._name.clicked.connect(lambda: webbrowser.open(f"{self._ctx.config.web_url}/me"))
        self._name.setToolTip("[개인] 화면은 곧 만들어져요 — 지금은 웹에서 열려요")
        avatar = Avatar(30)
        bar.layout_.addWidget(avatar)
        bar.layout_.addWidget(self._name)
        logout = QPushButton("로그아웃")
        logout.setObjectName("textbtn")
        logout.setCursor(Qt.PointingHandCursor)
        logout.clicked.connect(self._on_sign_out)
        bar.layout_.addWidget(logout)
        bar.finish()

        cid = self._ctx.profile.character_id
        if cid:
            repo = self._ctx.repo
            run_async(self, lambda: repo.character_bytes(cid), lambda data, err: avatar.set_png(data if isinstance(data, bytes) else None))

    def _add_page(self, key: str, page: QWidget) -> None:
        self._pages[key] = page
        self._stack.addWidget(page)

    # ── 화면 전환 ──────────────────────────────────────────────
    def show_page(self, key: str) -> None:
        if self._room_page is not None:
            self._close_room()
        self._nav_buttons[key].setChecked(True)
        self._stack.setCurrentWidget(self._pages[key])
        page = self._pages[key]
        if isinstance(page, HomePage):
            page.refresh()

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
        self.show_page("home")

    def _close_room(self) -> None:
        page = self._room_page
        if page is None:
            return
        page.close_room()
        self._stack.removeWidget(page)
        page.deleteLater()
        self._room_page = None

    # ── 창 상태 ────────────────────────────────────────────────
    def changeEvent(self, event) -> None:  # noqa: N802
        super().changeEvent(event)
        # 창이 만들어지는 도중(아직 _chrome이 없을 때)에도 이 이벤트가 온다.
        chrome = getattr(self, "_chrome", None)
        if chrome is not None:
            chrome.set_maximized(self.isMaximized())

    def closeEvent(self, event) -> None:  # noqa: N802
        self._close_room()
        self._ctx.pomodoro.flush_pending()
        super().closeEvent(event)
        self._on_closed()
