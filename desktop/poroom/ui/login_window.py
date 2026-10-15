"""로그인 창 — [구글 계정으로 로그인]을 누르면 기본 브라우저가 열리고, 끝나면 이 창이 이어받는다."""
from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import QLabel, QPushButton, QVBoxLayout, QWidget

from ..auth import AuthError, AuthManager
from ..config import LOGIN_CALLBACK_URL
from . import theme
from .widgets import run_async

_ERRORS = {
    "port-in-use": "로그인에 쓰는 통로(53682번)를 다른 프로그램이 쓰고 있어요. 닫고 다시 시도해 주세요.",
    "network": "인터넷에 연결되지 않았어요. 연결을 확인하고 다시 시도해 주세요.",
    "timeout": "시간이 지나 로그인이 끝나지 않았어요. 다시 시도해 주세요.",
    "exchange-failed": "로그인 정보를 받지 못했어요. 다시 시도해 주세요.",
}


class LoginWindow(QWidget):
    signed_in = Signal()

    def __init__(self, auth: AuthManager, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("root")
        self.setWindowTitle("PoRoom(포룸) 로그인")
        self.resize(460, 420)
        self._auth = auth

        lay = QVBoxLayout(self)
        lay.setAlignment(Qt.AlignCenter)
        lay.setSpacing(12)
        logo = QLabel("PoRoom")
        logo.setStyleSheet(f"font-size: 38px; font-weight: 800; color: {theme.BRAND};")
        logo.setAlignment(Qt.AlignCenter)
        tagline = QLabel("화상회의 없이 함께 집중하는\n온라인 뽀모도로 작업실")
        tagline.setAlignment(Qt.AlignCenter)
        tagline.setObjectName("sub")
        lay.addWidget(logo)
        lay.addWidget(tagline)
        lay.addSpacing(18)

        self._button = QPushButton("구글 계정으로 로그인")
        self._button.setObjectName("primary")
        self._button.setMinimumHeight(42)
        self._button.setMinimumWidth(260)
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
            self.signed_in.emit()
            return
        key = error.args[0] if isinstance(error, AuthError) and error.args else str(error)
        self._message.setText(_ERRORS.get(str(key), f"로그인하지 못했어요. 다시 시도해 주세요. ({key})"))


def redirect_hint() -> str:
    """Supabase 대시보드에 등록해야 하는 주소(설정 안내용)."""
    return LOGIN_CALLBACK_URL
