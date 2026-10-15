"""실시간 연결 — Supabase Realtime(Phoenix 채널 프로토콜)을 직접 말하는 작은 클라이언트.

웹·앱과 같은 채널을 쓴다.
  room-presence:<방id>          접속 상태(presence)·타이핑·뽀모도로·공유 화면 신호
  room-chat:<방id>              방 채팅(broadcast: message / delete / clear / reaction)
  whisper-inbox:<방id>:<내id>   나에게 오는 귓속말
모두 private 채널이다(방 참여자만 듣고 보낼 수 있다 — 0061 마이그레이션).

이 클라이언트는 자기 스레드에서 돌고, 콜백도 그 스레드에서 불린다 — 화면에서는 Qt 시그널로 넘겨서 쓴다.
"""
from __future__ import annotations

import json
import threading
import time
from dataclasses import dataclass, field
from typing import Callable

from websockets.sync.client import connect

from .auth import AuthManager
from .config import Config

HEARTBEAT_SECONDS = 25
TOKEN_CHECK_SECONDS = 60

BroadcastHandler = Callable[[dict], None]
PresenceHandler = Callable[[dict[str, list[dict]]], None]
StatusHandler = Callable[[str], None]


@dataclass
class _Channel:
    name: str
    private: bool
    presence_key: str
    broadcast_handlers: dict[str, list[BroadcastHandler]] = field(default_factory=dict)
    presence_handlers: list[PresenceHandler] = field(default_factory=list)
    status_handlers: list[StatusHandler] = field(default_factory=list)
    # presence 상태: { 사용자 key: [meta, ...] }
    presence: dict[str, list[dict]] = field(default_factory=dict)
    joined: bool = False
    join_ref: str = ""
    pending_track: dict | None = None

    @property
    def topic(self) -> str:
        return f"realtime:{self.name}"


class RealtimeClient:
    def __init__(self, config: Config, auth: AuthManager) -> None:
        self._config = config
        self._auth = auth
        self._channels: dict[str, _Channel] = {}
        self._lock = threading.RLock()
        self._ws = None
        self._ref = 0
        self._thread: threading.Thread | None = None
        self._running = False
        self._wake = threading.Event()

    # ── 채널 등록 ──────────────────────────────────────────────
    def channel(self, name: str, private: bool = True, presence_key: str = "") -> _Channel:
        with self._lock:
            ch = self._channels.get(name)
            if ch is None:
                ch = _Channel(name=name, private=private, presence_key=presence_key)
                self._channels[name] = ch
            return ch

    def on_broadcast(self, name: str, event: str, handler: BroadcastHandler) -> None:
        with self._lock:
            self._channels[name].broadcast_handlers.setdefault(event, []).append(handler)

    def on_presence(self, name: str, handler: PresenceHandler) -> None:
        with self._lock:
            self._channels[name].presence_handlers.append(handler)

    def on_status(self, name: str, handler: StatusHandler) -> None:
        with self._lock:
            self._channels[name].status_handlers.append(handler)

    def start(self) -> None:
        if self._running or self._config.preview:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run, name="poroom-realtime", daemon=True)
        self._thread.start()

    def join(self, name: str) -> None:
        """채널에 참여한다(이미 연결돼 있으면 곧바로, 아니면 연결되는 대로)."""
        self.start()
        self._wake.set()

    def leave(self, name: str) -> None:
        with self._lock:
            ch = self._channels.pop(name, None)
        if ch and ch.joined:
            self._send({"topic": ch.topic, "event": "phx_leave", "payload": {}, "ref": self._next_ref()})

    def close(self) -> None:
        self._running = False
        self._wake.set()
        ws = self._ws
        if ws is not None:
            try:
                ws.close()
            except Exception:
                pass

    # ── 보내기 ─────────────────────────────────────────────────
    def send_broadcast(self, name: str, event: str, payload: dict) -> None:
        ch = self._channels.get(name)
        if ch is None or not ch.joined:
            return
        self._send(
            {
                "topic": ch.topic,
                "event": "broadcast",
                "payload": {"type": "broadcast", "event": event, "payload": payload},
                "ref": self._next_ref(),
                "join_ref": ch.join_ref,
            }
        )

    def track(self, name: str, payload: dict) -> None:
        """내 접속 상태를 알린다(바뀔 때마다 부른다). 아직 연결 전이면 연결되는 대로 보낸다."""
        ch = self._channels.get(name)
        if ch is None:
            return
        ch.pending_track = payload
        if ch.joined:
            self._send_track(ch)

    def _send_track(self, ch: _Channel) -> None:
        if ch.pending_track is None:
            return
        self._send(
            {
                "topic": ch.topic,
                "event": "presence",
                "payload": {"type": "presence", "event": "track", "payload": ch.pending_track},
                "ref": self._next_ref(),
                "join_ref": ch.join_ref,
            }
        )

    # ── 내부 ───────────────────────────────────────────────────
    def _next_ref(self) -> str:
        with self._lock:
            self._ref += 1
            return str(self._ref)

    def _send(self, message: dict) -> None:
        ws = self._ws
        if ws is None:
            return
        try:
            ws.send(json.dumps(message))
        except Exception:
            pass

    def _url(self) -> str:
        base = self._config.supabase_url.replace("https://", "wss://").replace("http://", "ws://")
        return f"{base}/realtime/v1/websocket?apikey={self._config.supabase_anon_key}&vsn=1.0.0"

    def _run(self) -> None:
        backoff = 1.0
        while self._running:
            try:
                with connect(self._url(), open_timeout=15, max_size=8 * 1024 * 1024) as ws:
                    self._ws = ws
                    backoff = 1.0
                    self._session(ws)
            except Exception:
                pass
            finally:
                self._ws = None
                with self._lock:
                    for ch in self._channels.values():
                        if ch.joined:
                            ch.joined = False
                            self._notify_status(ch, "closed")
            if not self._running:
                break
            self._wake.wait(timeout=backoff)
            self._wake.clear()
            backoff = min(backoff * 2, 15.0)

    def _join_all(self) -> None:
        token = self._auth.access_token() or self._config.supabase_anon_key
        with self._lock:
            channels = [ch for ch in self._channels.values() if not ch.joined and not ch.join_ref]
        for ch in channels:
            ch.join_ref = self._next_ref()
            self._send(
                {
                    "topic": ch.topic,
                    "event": "phx_join",
                    "payload": {
                        "config": {
                            "broadcast": {"ack": False, "self": False},
                            "presence": {"key": ch.presence_key},
                            "postgres_changes": [],
                            "private": ch.private,
                        },
                        "access_token": token,
                    },
                    "ref": ch.join_ref,
                    "join_ref": ch.join_ref,
                }
            )

    def _session(self, ws) -> None:
        with self._lock:
            for ch in self._channels.values():
                ch.joined = False
                ch.join_ref = ""
        self._join_all()
        last_heartbeat = time.time()
        last_token_check = time.time()
        last_token = self._auth.access_token()

        while self._running:
            try:
                raw = ws.recv(timeout=1.0)
            except TimeoutError:
                raw = None
            if raw is not None:
                try:
                    self._handle(json.loads(raw))
                except (ValueError, KeyError):
                    pass

            now = time.time()
            if now - last_heartbeat >= HEARTBEAT_SECONDS:
                self._send({"topic": "phoenix", "event": "heartbeat", "payload": {}, "ref": self._next_ref()})
                last_heartbeat = now
            if now - last_token_check >= TOKEN_CHECK_SECONDS:
                last_token_check = now
                token = self._auth.access_token()
                if token and token != last_token:
                    last_token = token
                    with self._lock:
                        joined = [c for c in self._channels.values() if c.joined]
                    for ch in joined:
                        self._send({"topic": ch.topic, "event": "access_token", "payload": {"access_token": token}, "ref": self._next_ref()})
            # 새로 등록된 채널이 있으면 참여시킨다.
            self._join_all()

    def _handle(self, msg: dict) -> None:
        topic = msg.get("topic", "")
        event = msg.get("event", "")
        payload = msg.get("payload") or {}
        if not topic.startswith("realtime:"):
            return
        with self._lock:
            ch = self._channels.get(topic[len("realtime:"):])
        if ch is None:
            return

        if event == "phx_reply":
            if msg.get("ref") == ch.join_ref:
                if payload.get("status") == "ok":
                    ch.joined = True
                    self._notify_status(ch, "subscribed")
                    self._send_track(ch)
                else:
                    ch.join_ref = ""
                    self._notify_status(ch, "error")
        elif event in ("phx_close", "phx_error"):
            ch.joined = False
            ch.join_ref = ""
            self._notify_status(ch, "closed")
        elif event == "broadcast":
            name = payload.get("event")
            inner = payload.get("payload")
            for handler in list(ch.broadcast_handlers.get(name, [])):
                try:
                    handler(inner if isinstance(inner, dict) else {})
                except Exception:
                    pass
        elif event == "presence_state":
            ch.presence = {key: list(value.get("metas", [])) for key, value in payload.items()}
            self._notify_presence(ch)
        elif event == "presence_diff":
            for key, value in (payload.get("leaves") or {}).items():
                gone = {m.get("phx_ref") for m in value.get("metas", [])}
                remaining = [m for m in ch.presence.get(key, []) if m.get("phx_ref") not in gone]
                if remaining:
                    ch.presence[key] = remaining
                else:
                    ch.presence.pop(key, None)
            for key, value in (payload.get("joins") or {}).items():
                existing = ch.presence.get(key, [])
                existing_refs = {m.get("phx_ref") for m in existing}
                existing.extend(m for m in value.get("metas", []) if m.get("phx_ref") not in existing_refs)
                ch.presence[key] = existing
            self._notify_presence(ch)

    def _notify_presence(self, ch: _Channel) -> None:
        snapshot: dict[str, list[dict]] = {k: list(v) for k, v in ch.presence.items()}
        for handler in list(ch.presence_handlers):
            try:
                handler(snapshot)
            except Exception:
                pass

    def _notify_status(self, ch: _Channel, status: str) -> None:
        for handler in list(ch.status_handlers):
            try:
                handler(status)
            except Exception:
                pass


def latest_meta(metas: list[dict]) -> dict | None:
    """한 사람의 접속(메타)이 여러 개면(탭 여러 개) 가장 최근 것을 쓴다 — 웹과 같은 규칙."""
    return metas[-1] if metas else None


