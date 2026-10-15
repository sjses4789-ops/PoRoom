"""로그인 창 — [구글 계정으로 로그인]을 누르면 기본 브라우저가 열리고, 끝나면 이 창이 이어받는다."""
from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QPixmap
from PySide6.QtWidgets import QHBoxLayout, QLabel, QMainWindow, QPushButton, QVBoxLayout, QWidget

from ..auth import AuthError, AuthManager
from ..config import LOGIN_CALLBACK_URL
from .chrome import ChromeRoot, WindowButton, app_icon, resource_path
from .widgets import run_async

_ERRORS = {
    "port-in-use": "로그인에 쓰는 통로(53682번)를 다른 프로그램이 쓰고 있어요. 닫고 다시 시도해 주세요.",
    "network": "인터넷에 연결되지 않았어요. 연결을 확인하고 다시 시도해 주세요.",
    "timeout": "시간이 지나 로그인이 끝나지 않았어요. 다시 시도해 주세요.",
    "exchange-failed": "로그인 정보를 받지 못했어요. 다시 시도해 주세요.",
}


class _DragBar(QWidget):
    """로그인 창의 얇은 제목 줄 — 끌어서 옮기고, 오른쪽에 닫기 버튼만 둔다."""

    def __init__(self, window: QWidget) -> None:
        super().__init__()
        self._window = window
        self.setObjectName("topbar")
        self.setFixedHeight(40)
        lay = QHBoxLayout(self)
        lay.setContentsMargins(14, 0, 0, 0)
        icon = QLabel()
        icon.setPixmap(app_icon().pixmap(18, 18))
        title = QLabel("PoRoom")
        title.setObjectName("brand")
        lay.addWidget(icon)
        lay.addWidget(title)
        lay.addStretch(1)
        self.close_btn = WindowButton("✕", "close")
        self.close_btn.clicked.connect(window.close)
        lay.addWidget(self.close_btn)

    def mousePressEvent(self, event) -> None:  # noqa: N802
        if event.button() == Qt.LeftButton and self._window.windowHandle() is not None:
            self._window.windowHandle().startSystemMove()
        super().mousePressEvent(event)


class LoginWindow(QMainWindow):
    signed_in = Signal()

    def __init__(self, auth: AuthManager, on_closed) -> None:
        super().__init__()
        self._auth = auth
        self._on_closed = on_closed
        self._finished_login = False
        self.setWindowFlags(Qt.Window | Qt.FramelessWindowHint)
        self.setWindowTitle("PoRoom(포룸) 로그인")
        self.setWindowIcon(app_icon())
        self.setFixedSize(480, 520)

        root = ChromeRoot()
        self.setCentralWidget(root)
        root.body.addWidget(_DragBar(self))

        body = QWidget()
        body.setObjectName("page")
        root.body.addWidget(body, 1)
        lay = QVBoxLayout(body)
        lay.setAlignment(Qt.AlignCenter)
        lay.setSpacing(10)

        logo = QLabel()
        pixmap = QPixmap(resource_path("poroom-square.png"))
        logo.setPixmap(pixmap.scaled(84, 84, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        logo.setAlignment(Qt.AlignCenter)
        name = QLabel("PoRoom")
        name.setStyleSheet("font-size: 30px; font-weight: 800;")
        name.setAlignment(Qt.AlignCenter)
        tagline = QLabel("화상회의 없이 함께 집중하는\n온라인 뽀모도로 작업실")
        tagline.setAlignment(Qt.AlignCenter)
        tagline.setObjectName("sub")
        lay.addWidget(logo)
        lay.addWidget(name)
        lay.addWidget(tagline)
        lay.addSpacing(22)

        self._button = QPushButton("구글 계정으로 로그인")
        self._button.setObjectName("google")
        self._button.setCursor(Qt.PointingHandCursor)
        self._button.setMinimumHeight(42)
        self._button.setMinimumWidth(270)
        self._button.clicked.connect(self._start)
        lay.addWidget(self._button, 0, Qt.AlignHCenter)

        self._message = QLabel("웹(poroom.kr)과 같은 계정으로 이어서 사용할 수 있어요.")
        self._message.setObjectName("muted")
        self._message.setAlignment(Qt.AlignCenter)
        self._message.setWordWrap(True)
        self._message.setMaximumWidth(340)
        lay.addWidget(self._message, 0, Qt.AlignHCenter)

    def _start(self) -> None:
        self._button.setEnabled(False)
        self._message.setText("브라우저에서 구글 로그인을 끝내 주세요...")
        run_async(self, self._auth.sign_in_with_google, self._finished)

    def _finished(self, _result: object, error: Exception | None) -> None:
        self._button.setEnabled(True)
        if error is None:
            self._finished_login = True
            self.signed_in.emit()
            return
        key = error.args[0] if isinstance(error, AuthError) and error.args else str(error)
        self._message.setText(_ERRORS.get(str(key), f"로그인하지 못했어요. 다시 시도해 주세요. ({key})"))

    def closeEvent(self, event) -> None:  # noqa: N802
        super().closeEvent(event)
        # 로그인을 끝내고 닫히는 경우가 아니라, 사용자가 창을 닫은 경우에만 알린다(프로그램 종료).
        if not self._finished_login:
            self._on_closed()


def redirect_hint() -> str:
    """Supabase 대시보드에 등록해야 하는 주소(설정 안내용)."""
    return LOGIN_CALLBACK_URL
