"""로그인 — 기본 브라우저로 구글 로그인(PKCE) → 이 프로그램이 받아 같은 계정으로 동작한다.

흐름
 1) 임시 비밀값(code_verifier)과 그 해시(code_challenge)를 만든다.
 2) 이 PC의 127.0.0.1:LOGIN_CALLBACK_PORT에 작은 웹 서버를 잠깐 연다.
 3) 기본 브라우저로 Supabase의 구글 로그인 주소를 연다(redirect_to = 위 서버 주소).
 4) 로그인이 끝나면 브라우저가 서버 주소로 "code"를 들고 돌아온다 → 서버가 받는다.
 5) code + code_verifier로 Supabase에 로그인 토큰(access/refresh)을 교환한다.

세션(토큰)은 %APPDATA%/PoRoom/session.json에 저장해 다음 실행 때 자동으로 이어 간다.
"""
from __future__ import annotations

import base64
import hashlib
import json
import secrets
import threading
import time
import webbrowser
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

import httpx

from .config import LOGIN_CALLBACK_PORT, LOGIN_CALLBACK_URL, Config, data_dir

SESSION_FILE = "session.json"
REFRESH_MARGIN_SECONDS = 90


@dataclass
class Session:
    access_token: str
    refresh_token: str
    expires_at: float  # epoch seconds
    user_id: str
    email: str | None = None

    def to_json(self) -> dict:
        return {
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "expires_at": self.expires_at,
            "user_id": self.user_id,
            "email": self.email,
        }

    @staticmethod
    def from_token_response(data: dict) -> "Session":
        user = data.get("user") or {}
        expires_at = data.get("expires_at") or (time.time() + float(data.get("expires_in", 3600)))
        return Session(
            access_token=data["access_token"],
            refresh_token=data["refresh_token"],
            expires_at=float(expires_at),
            user_id=str(user.get("id", "")),
            email=user.get("email"),
        )


class AuthError(Exception):
    pass


def _pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)[:96]
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return verifier, challenge


_DONE_PAGE = """<!doctype html><html lang="ko"><meta charset="utf-8"><title>PoRoom</title>
<body style="font-family:system-ui,'Malgun Gothic',sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#fafafa;color:#171717">
<div style="text-align:center"><h2 style="margin:0 0 8px">{title}</h2><p style="margin:0;color:#737373">{body}</p></div></body></html>"""


class _CallbackHandler(BaseHTTPRequestHandler):
    result: dict = {}
    done = threading.Event()

    def do_GET(self) -> None:  # noqa: N802 (http.server API)
        parsed = urlparse(self.path)
        if parsed.path != "/callback":
            self.send_response(404)
            self.end_headers()
            return
        query = parse_qs(parsed.query)
        type(self).result = {k: v[0] for k, v in query.items()}
        ok = "code" in query
        page = _DONE_PAGE.format(
            title="로그인이 끝났어요" if ok else "로그인하지 못했어요",
            body="이 창은 닫으셔도 돼요. PoRoom 프로그램으로 돌아가 주세요." if ok else "PoRoom 프로그램에서 다시 시도해 주세요.",
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(page)))
        self.end_headers()
        self.wfile.write(page)
        type(self).done.set()

    def log_message(self, format: str, *args) -> None:  # noqa: A002 (http.server API)
        return


class AuthManager:
    """로그인 세션을 들고 있고, 만료 직전에 알아서 갱신한다."""

    def __init__(self, config: Config) -> None:
        self._config = config
        self._lock = threading.Lock()
        self.session: Session | None = None
        self._path: Path = data_dir() / SESSION_FILE

    # ── 세션 보관 ──────────────────────────────────────────────
    def load(self) -> bool:
        """저장된 세션이 있으면 불러와서 갱신해 본다. 성공하면 True."""
        try:
            raw = json.loads(self._path.read_text(encoding="utf-8"))
            session = Session(**raw)
        except (OSError, ValueError, TypeError):
            return False
        self.session = session
        try:
            self.ensure_fresh(force=session.expires_at - time.time() < REFRESH_MARGIN_SECONDS)
        except AuthError:
            self.session = None
            return False
        return self.session is not None

    def _save(self) -> None:
        if self.session is None:
            return
        try:
            self._path.write_text(json.dumps(self.session.to_json()), encoding="utf-8")
        except OSError:
            pass

    def sign_out(self) -> None:
        self.session = None
        try:
            self._path.unlink()
        except OSError:
            pass

    # ── 토큰 ───────────────────────────────────────────────────
    @property
    def user_id(self) -> str | None:
        return self.session.user_id if self.session else None

    @property
    def is_signed_in(self) -> bool:
        return self.session is not None

    def access_token(self) -> str | None:
        self.ensure_fresh()
        return self.session.access_token if self.session else None

    def ensure_fresh(self, force: bool = False) -> None:
        with self._lock:
            session = self.session
            if session is None:
                return
            if not force and session.expires_at - time.time() > REFRESH_MARGIN_SECONDS:
                return
            try:
                res = httpx.post(
                    f"{self._config.supabase_url}/auth/v1/token",
                    params={"grant_type": "refresh_token"},
                    headers={"apikey": self._config.supabase_anon_key},
                    json={"refresh_token": session.refresh_token},
                    timeout=15,
                )
            except httpx.HTTPError as exc:
                # 네트워크가 잠깐 끊긴 것일 수 있다 — 세션은 버리지 않고 다음에 다시 시도한다.
                raise AuthError("network") from exc
            if res.status_code != 200:
                # 갱신 토큰이 더 이상 유효하지 않다(다른 곳에서 로그아웃 등) — 다시 로그인해야 한다.
                self.session = None
                self._save_cleared()
                raise AuthError("refresh-failed")
            self.session = Session.from_token_response(res.json())
            self._save()

    def _save_cleared(self) -> None:
        try:
            self._path.unlink()
        except OSError:
            pass

    # ── 구글 로그인 ────────────────────────────────────────────
    def sign_in_with_google(self, timeout_seconds: int = 180) -> Session:
        """기본 브라우저를 열어 구글 로그인을 하고, 끝나면 세션을 돌려준다(이 함수는 끝날 때까지 기다린다)."""
        verifier, challenge = _pkce_pair()

        _CallbackHandler.result = {}
        _CallbackHandler.done = threading.Event()
        try:
            server = HTTPServer(("127.0.0.1", LOGIN_CALLBACK_PORT), _CallbackHandler)
        except OSError as exc:
            raise AuthError("port-in-use") from exc
        server.timeout = 1

        url = (
            f"{self._config.supabase_url}/auth/v1/authorize"
            f"?provider=google&redirect_to={quote(LOGIN_CALLBACK_URL, safe='')}"
            f"&code_challenge={challenge}&code_challenge_method=s256"
        )
        webbrowser.open(url)

        deadline = time.time() + timeout_seconds
        try:
            while not _CallbackHandler.done.is_set() and time.time() < deadline:
                server.handle_request()
        finally:
            server.server_close()

        result = _CallbackHandler.result
        code = result.get("code")
        if not code:
            raise AuthError(result.get("error_description") or result.get("error") or "timeout")

        try:
            res = httpx.post(
                f"{self._config.supabase_url}/auth/v1/token",
                params={"grant_type": "pkce"},
                headers={"apikey": self._config.supabase_anon_key},
                json={"auth_code": code, "code_verifier": verifier},
                timeout=20,
            )
        except httpx.HTTPError as exc:
            raise AuthError("network") from exc
        if res.status_code != 200:
            raise AuthError("exchange-failed")
        self.session = Session.from_token_response(res.json())
        self._save()
        return self.session
