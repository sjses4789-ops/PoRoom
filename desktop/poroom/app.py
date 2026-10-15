"""프로그램 시작 — 로그인 → 메인 창."""
from __future__ import annotations

import sys
import threading
import webbrowser

from PySide6.QtWidgets import QApplication, QMessageBox

from .api import Api
from .auth import AuthError, AuthManager
from .config import Config, load_config
from .context import AppContext
from .models import Profile
from .pomodoro import PomodoroController
from .realtime import RealtimeClient
from .repo import PreviewRepository, Repository
from .ui import theme
from .ui.login_window import LoginWindow
from .ui.main_window import MainWindow


class PoRoomApp:
    def __init__(self, preview: bool = False) -> None:
        self.config: Config = load_config(preview)
        self.qt = QApplication.instance() or QApplication(sys.argv)
        self.qt.setApplicationName("PoRoom")
        self.qt.setStyleSheet(theme.STYLESHEET)
        self.auth = AuthManager(self.config)
        self.api = Api(self.config, self.auth)
        self.realtime = RealtimeClient(self.config, self.auth)
        self.window: MainWindow | None = None
        self.login: LoginWindow | None = None

    # ── 시작 ───────────────────────────────────────────────────
    def run(self) -> int:
        if not self.config.preview and not self.config.has_backend:
            QMessageBox.critical(
                None,
                "PoRoom",
                "서버 설정(env.json)을 찾지 못했어요.\n프로그램 폴더에서 `python tools/gen_env.py`를 먼저 실행해 주세요.",
            )
            return 1
        if self.config.preview or self.auth.load():
            self._open_main()
        else:
            self._show_login()
        code = self.qt.exec()
        self.realtime.close()
        self.api.close()
        return code

    def _show_login(self) -> None:
        self.login = LoginWindow(self.auth)
        self.login.signed_in.connect(self._after_login)
        self.login.show()

    def _after_login(self) -> None:
        if self.login is not None:
            self.login.close()
            self.login = None
        self._open_main()

    def _open_main(self) -> None:
        if self.config.preview:
            repo = PreviewRepository()
        else:
            user_id = self.auth.user_id
            if not user_id:
                self._show_login()
                return
            repo = Repository(self.api, self.config, user_id)

        try:
            profile = repo.fetch_profile()
        except Exception:  # noqa: BLE001 - 네트워크 오류 등
            QMessageBox.warning(None, "PoRoom", "내 정보를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 실행해 주세요.")
            self._sign_out()
            return
        if profile is None or not profile.is_complete:
            self._need_web_setup()
            return
        if profile.is_banned:
            QMessageBox.warning(None, "PoRoom", "이용이 제한된 계정이에요.")
            self._sign_out()
            return

        ctx = AppContext(
            config=self.config,
            repo=repo,
            realtime=self.realtime,
            pomodoro=PomodoroController(repo),
            profile=profile,
        )
        self.window = MainWindow(ctx, self._sign_out)
        self.window.show()
        self.realtime.start()
        # poroom에 들어와 있으면 그날 출석 — 서버가 각자 시간대 자정 기준으로 기록한다.
        threading.Thread(target=repo.mark_attendance, daemon=True).start()

    def _need_web_setup(self) -> None:
        box = QMessageBox()
        box.setWindowTitle("PoRoom")
        box.setText("처음 가입하셨다면 웹에서 닉네임과 직업을 먼저 정해 주세요.")
        open_btn = box.addButton("웹에서 설정하기", QMessageBox.AcceptRole)
        box.addButton("닫기", QMessageBox.RejectRole)
        box.exec()
        if box.clickedButton() is open_btn:
            webbrowser.open(f"{self.config.web_url}/onboarding")
        self._sign_out()

    def _sign_out(self) -> None:
        self.realtime.close()
        self.auth.sign_out()
        if self.window is not None:
            self.window.close()
            self.window = None
        self.realtime = RealtimeClient(self.config, self.auth)
        self._show_login()


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    return PoRoomApp(preview="--preview" in args).run()


__all__ = ["PoRoomApp", "main", "Profile", "AuthError"]
