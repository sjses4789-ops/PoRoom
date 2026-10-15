"""로그인 직후 로그인 창이 닫혀도 프로그램이 끝나지 않고 메인 창이 떠 있는지 시험:  python tests/test_login_flow.py"""
from __future__ import annotations

import os
import sys
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PySide6.QtCore import QTimer  # noqa: E402

from poroom.app import PoRoomApp  # noqa: E402

result: dict = {}


def main() -> int:
    app = PoRoomApp(preview=True)
    app._show_login()  # noqa: SLF001
    assert app.login is not None and app.login.isVisible()

    def log_in() -> None:
        app.login.signed_in.emit()  # 로그인이 끝났다고 알린다

    def check() -> None:
        result["main_visible"] = app.window is not None and app.window.isVisible()
        result["login_closed"] = app.login is None
        app.qt.quit()

    QTimer.singleShot(200, log_in)
    QTimer.singleShot(1200, check)
    code = app.qt.exec()
    assert result.get("main_visible"), result
    assert result.get("login_closed"), result
    assert code == 0
    print("login flow 시험 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
