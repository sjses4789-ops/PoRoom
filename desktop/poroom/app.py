"""프로그램 시작 — 로그인 → 메인 창."""
from __future__ import annotations

import sys
import threading
import traceback
import webbrowser
from datetime import datetime

from PySide6.QtWidgets import QApplication, QMessageBox

from .api import Api
from .auth import AuthManager
from .config import Config, data_dir, load_config
from .context import AppContext
from .pomodoro import PomodoroController
from .realtime import RealtimeClient
from .repo import PreviewRepository, Repository
from .ui import theme
from .ui.chrome import app_icon
from .ui.login_window import LoginWindow
from .ui.main_window import MainWindow


def _log_error(text: str) -> None:
    """오류를 %APPDATA%/PoRoom/error.log에 남긴다(창이 갑자기 닫히는 문제를 나중에 볼 수 있게)."""
    try:
        with open(data_dir() / "error.log", "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now():%Y-%m-%d %H:%M:%S}]\n{text}\n")
    except OSError:
        pass


class PoRoomApp:
    def __init__(self, preview: bool = False) -> None:
        self.config: Config = load_config(preview)
        self.qt = QApplication.instance() or QApplication(sys.argv)
        self.qt.setApplicationName("PoRoom")
        self.qt.setWindowIcon(app_icon())
        self.qt.setStyleSheet(theme.STYLESHEET)
        # 창을 닫을 때마다 프로그램이 끝나면, 로그인 창을 닫는 순간 메인 창이 뜨기도 전에 종료돼 버린다 —
        # 종료는 직접(_quit) 결정한다.
        self.qt.setQuitOnLastWindowClosed(False)
        self.auth = AuthManager(self.config)
        self.api = Api(self.config, self.auth)
        self.realtime = RealtimeClient(self.config, self.auth)
        self.window: MainWindow | None = None
        self.login: LoginWindow | None = None
        self._switching = False  # 로그아웃 등으로 창을 바꾸는 중에는 창이 닫혀도 종료하지 않는다
        sys.excepthook = self._excepthook

    def _excepthook(self, exc_type, exc, tb) -> None:
        text = "".join(traceback.format_exception(exc_type, exc, tb))
        _log_error(text)
        print(text, file=sys.stderr)

    # ── 시작 ───────────────────────────────────────────────────
    def run(self) -> int:
        if not self.config.preview and not self.config.has_backend:
            QMessageBox.critical(
                None,
                "PoRoom",
                "서버 설정(env.json)을 찾지 못했어요.\n프로그램 폴더에서 `python tools/gen_env.py`를 먼저 실행해 주세요.",
            )
            return 1
        if not ((self.config.preview or self.auth.load()) and self._open_main()):
            self._show_login()
        code = self.qt.exec()
        self.realtime.close()
        self.api.close()
        return code

    def _quit(self) -> None:
        self.qt.quit()

    def _show_login(self) -> None:
        self.login = LoginWindow(self.auth, on_closed=self._on_login_closed)
        self.login.signed_in.connect(self._after_login)
        self.login.show()

    def _on_login_closed(self) -> None:
        if not self._switching:
            self._quit()

    def _after_login(self) -> None:
        login = self.login
        self.login = None
        # 메인 창을 먼저 띄운 뒤 로그인 창을 닫는다 — 순서가 바뀌면 잠깐 열린 창이 하나도 없어 보일 수 있다.
        self._switching = True
        try:
            opened = self._open_main()
        finally:
            if login is not None:
                login.close()
            self._switching = False
        if not opened and self.window is None and self.login is None:
            self._show_login()

    def _open_main(self) -> bool:
        """메인 창을 연다. 열지 못하면 이유를 알리고 False."""
        try:
            if self.config.preview:
                repo = PreviewRepository()
            else:
                user_id = self.auth.user_id
                if not user_id:
                    return False
                repo = Repository(self.api, self.config, user_id)
            profile = repo.fetch_profile()
        except Exception as exc:  # noqa: BLE001 - 네트워크 오류 등
            _log_error(traceback.format_exc())
            QMessageBox.warning(None, "PoRoom", f"내 정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.\n({exc})")
            self.auth.sign_out()
            return False
        if profile is None or not profile.is_complete:
            self._need_web_setup()
            return False
        if profile.is_banned:
            QMessageBox.warning(None, "PoRoom", "이용이 제한된 계정이에요.")
            self.auth.sign_out()
            return False

        ctx = AppContext(
            config=self.config,
            repo=repo,
            realtime=self.realtime,
            pomodoro=PomodoroController(repo),
            profile=profile,
        )
        try:
            self.window = MainWindow(ctx, self._sign_out, on_closed=self._on_main_closed)
        except Exception as exc:  # noqa: BLE001
            _log_error(traceback.format_exc())
            QMessageBox.critical(None, "PoRoom", f"화면을 만들지 못했어요.\n({exc})\n자세한 내용: %APPDATA%\\PoRoom\\error.log")
            return False
        self.window.show()
        self.realtime.start()
        # poroom에 들어와 있으면 그날 출석 — 서버가 각자 시간대 자정 기준으로 기록한다.
        threading.Thread(target=repo.mark_attendance, daemon=True).start()
        return True

    def _on_main_closed(self) -> None:
        if not self._switching:
            self._quit()

    def _need_web_setup(self) -> None:
        box = QMessageBox()
        box.setWindowTitle("PoRoom")
        box.setText("처음 가입하셨다면 웹에서 닉네임과 직업을 먼저 정해 주세요.")
        open_btn = box.addButton("웹에서 설정하기", QMessageBox.AcceptRole)
        box.addButton("닫기", QMessageBox.RejectRole)
        box.exec()
        if box.clickedButton() is open_btn:
            webbrowser.open(f"{self.config.web_url}/onboarding")
        self.auth.sign_out()

    def _sign_out(self) -> None:
        self._switching = True
        try:
            self.realtime.close()
            self.auth.sign_out()
            window = self.window
            self.window = None
            if window is not None:
                window.close()
            self.realtime = RealtimeClient(self.config, self.auth)
            self._show_login()
        finally:
            self._switching = False


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    return PoRoomApp(preview="--preview" in args).run()
