"""웹 프로젝트(.env.local)의 "공개" 값(Supabase URL / anon key)만 뽑아 desktop/env.json을 만든다.

anon key는 브라우저에도 공개되는 NEXT_PUBLIC_ 값이라 데스크탑 프로그램에 들어가도 안전하다 — 서비스 키 등 비공개 값은
절대 읽어오지 않는다.  사용:  python tools/gen_env.py
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENV_FILE = HERE.parent.parent / ".env.local"
WANTED = {"NEXT_PUBLIC_SUPABASE_URL": "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY": "SUPABASE_ANON_KEY"}


def main() -> int:
    out = {"WEB_URL": os.environ.get("POROOM_WEB_URL", "https://poroom.kr")}
    # 구글 "데스크톱 앱" 클라이언트(선택). ID는 공개 값이지만, 보안 비밀은 이 PC의 env.json에만 둔다(git에 올라가지 않는다).
    for key in ("GOOGLE_DESKTOP_CLIENT_ID", "GOOGLE_DESKTOP_CLIENT_SECRET"):
        if os.environ.get(key):
            out[key] = os.environ[key]
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
        if m and m.group(1) in WANTED:
            out[WANTED[m.group(1)]] = m.group(2).strip().strip("\"'")
    if "SUPABASE_URL" not in out or "SUPABASE_ANON_KEY" not in out:
        print("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 .env.local 에서 찾지 못했어요.", file=sys.stderr)
        return 1
    (HERE.parent / "env.json").write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print("env.json 생성 완료 (키 이름만):", ", ".join(out.keys()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
