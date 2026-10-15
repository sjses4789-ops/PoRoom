"""RealtimeClient를 가짜 Phoenix 서버에 붙여 보는 시험(서버 없이도 프로토콜 처리가 맞는지 확인):  python tests/test_realtime.py"""
from __future__ import annotations

import json
import sys
import threading
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from websockets.sync.server import serve  # noqa: E402

from poroom.config import Config  # noqa: E402
from poroom.realtime import RealtimeClient, latest_meta  # noqa: E402

received_by_server: list[dict] = []


class FakeAuth:
    user_id = "me"
    is_signed_in = True

    def access_token(self) -> str:
        return "token-1"


def handler(ws) -> None:
    for raw in ws:
        msg = json.loads(raw)
        received_by_server.append(msg)
        if msg["event"] == "phx_join":
            ws.send(json.dumps({"topic": msg["topic"], "event": "phx_reply", "payload": {"status": "ok", "response": {}}, "ref": msg["ref"]}))
            ws.send(json.dumps({"topic": msg["topic"], "event": "presence_state", "payload": {"u2": {"metas": [{"phx_ref": "a", "name": "하루", "pomodoroPhase": "focus"}]}}, "ref": None}))
            ws.send(json.dumps({"topic": msg["topic"], "event": "presence_diff", "payload": {"joins": {"u3": {"metas": [{"phx_ref": "b", "name": "달빛"}]}}, "leaves": {"u2": {"metas": [{"phx_ref": "a"}]}}}, "ref": None}))
            ws.send(json.dumps({"topic": msg["topic"], "event": "broadcast", "payload": {"type": "broadcast", "event": "message", "payload": {"id": "m1"}}, "ref": None}))


def main() -> int:
    server = serve(handler, "127.0.0.1", 0)
    port = server.socket.getsockname()[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()

    config = Config(supabase_url=f"http://127.0.0.1:{port}", supabase_anon_key="anon", web_url="http://x", preview=False)
    client = RealtimeClient(config, FakeAuth())  # type: ignore[arg-type]

    presence_snapshots: list[dict] = []
    events: list[dict] = []
    client.channel("room-presence:R", True, "me")
    client.on_presence("room-presence:R", presence_snapshots.append)
    client.on_broadcast("room-presence:R", "message", events.append)
    client.track("room-presence:R", {"name": "나", "pomodoroPhase": "idle"})
    client.join("room-presence:R")

    deadline = time.time() + 6
    while time.time() < deadline and not (len(presence_snapshots) >= 2 and events):
        time.sleep(0.1)
    client.send_broadcast("room-presence:R", "message", {"id": "m2"})
    time.sleep(0.5)
    client.close()
    server.shutdown()

    join = next(m for m in received_by_server if m["event"] == "phx_join")
    assert join["topic"] == "realtime:room-presence:R", join
    assert join["payload"]["config"]["private"] is True
    assert join["payload"]["config"]["presence"]["key"] == "me"
    assert join["payload"]["access_token"] == "token-1"
    assert len(presence_snapshots) >= 2, presence_snapshots
    last = presence_snapshots[-1]
    assert "u2" not in last and latest_meta(last["u3"])["name"] == "달빛", last
    assert events and events[0]["id"] == "m1"
    track = next(m for m in received_by_server if m["event"] == "presence")
    assert track["payload"]["event"] == "track" and track["payload"]["payload"]["name"] == "나"
    bc = [m for m in received_by_server if m["event"] == "broadcast"]
    assert bc and bc[0]["payload"]["payload"] == {"id": "m2"}
    print("realtime 시험 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
