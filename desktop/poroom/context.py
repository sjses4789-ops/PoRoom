"""화면들이 같이 쓰는 것들(로그인·저장소·실시간·뽀모도로) — 한 번 만들어 모든 화면에 넘긴다."""
from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass, field

from .config import Config, data_dir
from .models import Profile
from .pomodoro import PomodoroController
from .realtime import RealtimeClient
from .repo import RepositoryProtocol


def load_browser_id() -> str:
    """이 PC(프로그램)를 구분하는 값 — 같은 계정이 다른 곳에서 같은 방에 동시에 접속했는지 가리는 데 쓴다(웹의 browserId)."""
    path = data_dir() / "browser_id.txt"
    try:
        value = path.read_text(encoding="utf-8").strip()
        if value:
            return value
    except OSError:
        pass
    value = "desktop-" + secrets.token_hex(12)
    try:
        path.write_text(value, encoding="utf-8")
    except OSError:
        pass
    return value


@dataclass
class AppContext:
    config: Config
    repo: RepositoryProtocol
    realtime: RealtimeClient
    pomodoro: PomodoroController
    profile: Profile
    browser_id: str = field(default_factory=load_browser_id)
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    @property
    def user_id(self) -> str:
        return self.profile.id
