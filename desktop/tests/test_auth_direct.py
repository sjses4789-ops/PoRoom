"""구글 데스크톱 클라이언트로 직접 로그인하는 흐름을 가짜 구글·가짜 Supabase·가짜 브라우저로 시험:  python tests/test_auth_direct.py"""
from __future__ import annotations

import hashlib
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


class Fake(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        path = urlparse(self.path)
        if path.path == "/google-token":
            seen["google_form"] = parse_qs(raw.decode())
            payload = {"id_token": "GOOGLE-ID-TOKEN", "access_token": "x"}
        else:
            seen["supabase_grant"] = parse_qs(path.query).get("grant_type", [""])[0]
            seen["supabase_body"] = json.loads(raw)
            payload = {"access_token": "AT", "refresh_token": "RT", "expires_in": 3600, "user": {"id": "user-9", "email": "a@b.c"}}
        out = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.end_headers()
        self.wfile.write(out)

    def log_message(self, *a) -> None:
        return


def main() -> int:
    srv = HTTPServer(("127.0.0.1", 0), Fake)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    auth_module.GOOGLE_TOKEN_URL = f"http://127.0.0.1:{port}/google-token"
    config = Config(
        supabase_url=f"http://127.0.0.1:{port}", supabase_anon_key="anon", web_url="http://x", preview=False,
        google_desktop_client_id="CLIENT-ID", google_desktop_client_secret="CLIENT-SECRET",
    )
    opened: list[str] = []

    def fake_browser(url: str) -> bool:
        opened.append(url)
        state = parse_qs(urlparse(url).query)["state"][0]

        def hit() -> None:
            time.sleep(0.3)
            urlopen(f"http://127.0.0.1:53682/callback?code=GCODE&state={state}").read()

        threading.Thread(target=hit, daemon=True).start()
        return True

    auth_module.webbrowser.open = fake_browser  # type: ignore[assignment]
    mgr = AuthManager(config)
    mgr._path = Path(__file__).parent / "_session_test2.json"  # noqa: SLF001
    session = mgr.sign_in_with_google(timeout_seconds=10)
    srv.shutdown()

    q = parse_qs(urlparse(opened[0]).query)
    assert opened[0].startswith("https://accounts.google.com/o/oauth2/v2/auth?"), opened[0]
    assert q["client_id"] == ["CLIENT-ID"] and q["code_challenge_method"] == ["S256"], q
    assert q["redirect_uri"] == ["http://127.0.0.1:53682/callback"], q
    form = seen["google_form"]
    assert form["code"] == ["GCODE"] and form["client_secret"] == ["CLIENT-SECRET"] and form["grant_type"] == ["authorization_code"], form
    body = seen["supabase_body"]
    assert seen["supabase_grant"] == "id_token" and body["provider"] == "google" and body["id_token"] == "GOOGLE-ID-TOKEN", seen
    # 구글에는 nonce의 해시를, Supabase에는 원본을 넘겨야 서로 맞는다.
    assert q["nonce"][0] == hashlib.sha256(body["nonce"].encode()).hexdigest()
    assert session.user_id == "user-9"
    mgr.sign_out()
    print("auth direct 시험 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
