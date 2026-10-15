"""로그인(PKCE) 흐름을 가짜 Supabase·가짜 브라우저로 시험:  python tests/test_auth.py"""
from __future__ import annotations

import json
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import poroom.auth as auth_module  # noqa: E402
from poroom.auth import AuthManager  # noqa: E402
from poroom.config import Config  # noqa: E402

seen: dict = {}


class FakeSupabase(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        query = parse_qs(urlparse(self.path).query)
        seen["grant"] = query.get("grant_type", [""])[0]
        seen["body"] = body
        payload = {
            "access_token": "AT", "refresh_token": "RT", "expires_in": 3600,
            "user": {"id": "user-1", "email": "a@b.c"},
        }
        raw = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def log_message(self, *a) -> None:
        return


def main() -> int:
    srv = HTTPServer(("127.0.0.1", 0), FakeSupabase)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    config = Config(supabase_url=f"http://127.0.0.1:{port}", supabase_anon_key="anon", web_url="http://x", preview=False)

    opened: list[str] = []

    def fake_browser(url: str) -> bool:
        opened.append(url)
        # 브라우저 대신: 로그인이 끝나 code를 들고 돌아오는 요청을 흉내 낸다.
        def hit() -> None:
            time.sleep(0.3)
            urlopen("http://127.0.0.1:53682/callback?code=CODE123").read()
        threading.Thread(target=hit, daemon=True).start()
        return True

    auth_module.webbrowser.open = fake_browser  # type: ignore[assignment]
    mgr = AuthManager(config)
    mgr._path = Path(__file__).parent / "_session_test.json"  # noqa: SLF001
    session = mgr.sign_in_with_google(timeout_seconds=10)
    srv.shutdown()

    q = parse_qs(urlparse(opened[0]).query)
    assert q["provider"] == ["google"] and q["code_challenge_method"] == ["s256"], q
    assert q["redirect_to"] == ["http://127.0.0.1:53682/callback"], q
    assert seen["grant"] == "pkce" and seen["body"]["auth_code"] == "CODE123", seen
    assert len(seen["body"]["code_verifier"]) >= 43
    assert session.user_id == "user-1" and mgr.is_signed_in
    assert json.loads(mgr._path.read_text(encoding="utf-8"))["refresh_token"] == "RT"  # noqa: SLF001
    mgr.sign_out()
    assert not mgr._path.exists()  # noqa: SLF001
    print("auth 시험 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
