"""미리보기 화면을 PNG로 저장한다(화면 확인용):  python tools/screenshot.py <저장 폴더>"""
from __future__ import annotations

import os
import sys
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PySide6.QtCore import QTimer  # noqa: E402

from poroom.app import PoRoomApp  # noqa: E402
from poroom.ui.login_window import LoginWindow  # noqa: E402


def main() -> int:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    out.mkdir(parents=True, exist_ok=True)
    app = PoRoomApp(preview=True)
    app._open_main()  # noqa: SLF001
    win = app.window
    assert win is not None

    def shot(name: str) -> None:
        win.grab().save(str(out / f"{name}.png"))

    def dialogs() -> None:
        from poroom.ui.dialogs import CreateRoomDialog, NicknameDialog
        from poroom.models import NicknameContext

        d = CreateRoomDialog(win)
        d.show()
        QTimer.singleShot(300, lambda: (d.grab().save(str(out / "create_room.png")), d.close()))
        n = NicknameDialog(win, NicknameContext("미리보기", [("n1", "새벽글쟁이")]), win._ctx.repo)  # noqa: SLF001
        n.show()
        QTimer.singleShot(500, lambda: (n.grab().save(str(out / "nickname.png")), n.close()))

    def step1() -> None:
        win.resize(1280, 1100)
        shot("home")
        dialogs()
        login = LoginWindow(app.auth, on_closed=lambda: None)
        login.show()
        QTimer.singleShot(300, lambda: (login.grab().save(str(out / "login.png")), login.close()))
        win.open_room("p1")
        QTimer.singleShot(700, step2)

    def step2() -> None:
        win._ctx.pomodoro.start("p1")  # noqa: SLF001
        QTimer.singleShot(600, step3)

    def step3() -> None:
        shot("room")
        app.qt.quit()

    QTimer.singleShot(1500, step1)
    app.qt.exec()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
