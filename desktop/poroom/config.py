"""설정 — env.json(웹의 공개 값)과 실행 옵션."""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path


def app_dir() -> Path:
    """실행 파일(또는 소스) 옆 폴더. PyInstaller로 묶였을 때도 env.json을 이 폴더에서 찾는다."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def data_dir() -> Path:
    """로그인 세션·이미지 캐시를 두는 사용자 폴더(%APPDATA%/PoRoom)."""
    base = os.environ.get("APPDATA") or str(Path.home())
    path = Path(base) / "PoRoom"
    path.mkdir(parents=True, exist_ok=True)
    return path


@dataclass(frozen=True)
class Config:
    supabase_url: str
    supabase_anon_key: str
    web_url: str
    preview: bool

    @property
    def has_backend(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)


# 구글 로그인이 끝난 뒤 이 주소로 돌아온다 — Supabase 대시보드의 Redirect URLs에 이 주소를 그대로 등록해야 한다.
LOGIN_CALLBACK_PORT = 53682
LOGIN_CALLBACK_URL = f"http://127.0.0.1:{LOGIN_CALLBACK_PORT}/callback"


def load_config(preview: bool = False) -> Config:
    values: dict[str, str] = {}
    env_file = app_dir() / "env.json"
    if env_file.exists():
        try:
            values = json.loads(env_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            values = {}
    return Config(
        supabase_url=(os.environ.get("SUPABASE_URL") or values.get("SUPABASE_URL", "")).rstrip("/"),
        supabase_anon_key=os.environ.get("SUPABASE_ANON_KEY") or values.get("SUPABASE_ANON_KEY", ""),
        web_url=(os.environ.get("POROOM_WEB_URL") or values.get("WEB_URL") or "https://poroom.kr").rstrip("/"),
        preview=preview or os.environ.get("POROOM_PREVIEW") == "1",
    )
