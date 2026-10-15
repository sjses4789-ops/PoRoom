"""데이터 접근 — 화면이 서버 세부(PostgREST 문법 등)를 몰라도 되게 감싼다. 웹의 같은 조회를 그대로 옮겼다.

Repository      실제 서버(Supabase + 웹 서버 액션)
PreviewRepository  로그인·서버 없이 예시 데이터(화면 모양 확인·개발용: --preview)
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Protocol

from .api import Api, ApiError
from .config import Config, data_dir
from .models import ChatMessage, Profile, RoomInfo, RoomMember, RoomSummary, today_kst


class RepositoryProtocol(Protocol):
    user_id: str

    def fetch_profile(self) -> Profile | None: ...
    def fetch_rooms(self) -> list[RoomSummary]: ...
    def join_system_room(self, kind: str) -> str | None: ...
    def join_open_room(self, room_id: str) -> bool: ...
    def leave_room(self, room_id: str) -> None: ...
    def fetch_room(self, room_id: str) -> tuple[RoomInfo, list[RoomMember]] | None: ...
    def fetch_messages(self, room_id: str) -> list[ChatMessage]: ...
    def fetch_message(self, message_id: str) -> ChatMessage | None: ...
    def send_message(self, room_id: str, content: str) -> ChatMessage | None: ...
    def delete_message(self, message_id: str) -> bool: ...
    def set_work_status(self, room_id: str, status: str | None) -> None: ...
    def record_focus(self, room_id: str, delta: int, date: str, revalidate: bool = False) -> None: ...
    def record_break(self, room_id: str, delta: int, date: str) -> None: ...
    def touch_last_seen(self, room_id: str) -> None: ...
    def mark_attendance(self) -> None: ...
    def character_bytes(self, character_id: str) -> bytes | None: ...


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


class Repository:
    def __init__(self, api: Api, config: Config, user_id: str) -> None:
        self._api = api
        self._config = config
        self.user_id = user_id
        self._cache_dir: Path = data_dir() / "characters"
        self._cache_dir.mkdir(parents=True, exist_ok=True)

    # ── 프로필 ─────────────────────────────────────────────────
    def fetch_profile(self) -> Profile | None:
        row = self._api.select(
            "users",
            "id,name,character_id,position,is_banned,timezone",
            {"id": f"eq.{self.user_id}"},
            single=True,
        )
        if row is None:
            return None
        return Profile(
            id=row["id"],
            name=row.get("name"),
            character_id=row.get("character_id"),
            position=row.get("position"),
            is_banned=bool(row.get("is_banned")),
            timezone=row.get("timezone"),
        )

    def mark_attendance(self) -> None:
        # poroom에 들어와 있는 것이 곧 출석 — 날짜는 서버가 사용자 시간대의 자정 기준으로 계산한다.
        self._api.web_rpc("markAttendanceToday", [None])

    # ── 방 목록 ────────────────────────────────────────────────
    def fetch_rooms(self) -> list[RoomSummary]:
        rows = self._api.select(
            "rooms",
            "id,name,color,tags,join_type,target_position,is_system,capacity,created_at",
            order="created_at.desc",
            limit=200,
        )
        ids = [r["id"] for r in rows]
        members: list[dict] = []
        if ids:
            try:
                members = self._api.select("room_members", "room_id,user_id", {"room_id": f"in.({','.join(ids)})"})
            except ApiError:
                members = []
        count: dict[str, int] = {}
        mine: set[str] = set()
        for m in members:
            count[m["room_id"]] = count.get(m["room_id"], 0) + 1
            if m["user_id"] == self.user_id:
                mine.add(m["room_id"])
        return [
            RoomSummary(
                id=r["id"],
                name=r["name"],
                color=r.get("color") or "neutral",
                is_system=bool(r.get("is_system")),
                join_type=r.get("join_type") or "invite",
                member_count=count.get(r["id"], 0),
                is_member=r["id"] in mine,
                capacity=r.get("capacity"),
                tags=list(r.get("tags") or []),
                target_position=r.get("target_position"),
            )
            for r in rows
        ]

    def join_system_room(self, kind: str) -> str | None:
        result = self._api.web_rpc("joinSystemRoom", [kind])
        return result.get("roomId") if isinstance(result, dict) else None

    def join_open_room(self, room_id: str) -> bool:
        self._api.web_rpc("joinOpenRoom", [room_id])
        row = self._api.select(
            "room_members", "room_id", {"room_id": f"eq.{room_id}", "user_id": f"eq.{self.user_id}"}, single=True
        )
        return row is not None

    def leave_room(self, room_id: str) -> None:
        self._api.web_rpc("leaveRoom", [room_id])

    # ── 방 ─────────────────────────────────────────────────────
    def fetch_room(self, room_id: str) -> tuple[RoomInfo, list[RoomMember]] | None:
        room = self._api.select(
            "rooms",
            "id,name,color,join_type,capacity,is_system,owner_id,record_visibility",
            {"id": f"eq.{room_id}"},
            single=True,
        )
        if room is None:
            return None
        member_rows = self._api.select(
            "room_members",
            "user_id,share_records,last_seen_at,is_vice,nickname,work_status,users(name,character_id,chat_color,position)",
            {"room_id": f"eq.{room_id}"},
        )
        visibility = room.get("record_visibility") or "shared"
        visible_ids = [
            m["user_id"]
            for m in member_rows
            if visibility == "shared" or m["user_id"] == self.user_id or (visibility == "free" and m.get("share_records"))
        ]
        today_by_user: dict[str, int] = {}
        if visible_ids:
            rows = self._api.select(
                "daily_records",
                "user_id,chars",
                {"user_id": f"in.({','.join(visible_ids)})", "record_date": f"eq.{today_kst()}"},
            )
            for r in rows:
                today_by_user[r["user_id"]] = today_by_user.get(r["user_id"], 0) + int(r.get("chars") or 0)

        is_system = bool(room.get("is_system"))
        owner_id = room["owner_id"]
        info = RoomInfo(
            id=room["id"],
            name=room["name"],
            color=room.get("color") or "neutral",
            join_type=room.get("join_type") or "invite",
            is_system=is_system,
            owner_id=owner_id,
            record_visibility=visibility,
            capacity=room.get("capacity"),
        )
        members: list[RoomMember] = []
        for m in member_rows:
            user = m.get("users") or {}
            uid = m["user_id"]
            members.append(
                RoomMember(
                    id=uid,
                    name=(m.get("nickname") or user.get("name") or ""),
                    position="webtoon" if user.get("position") == "webtoon" else "novelist",
                    character_id=user.get("character_id"),
                    chat_color=user.get("chat_color"),
                    work_status=m.get("work_status"),
                    is_owner=(not is_system) and uid == owner_id,
                    is_vice=bool(m.get("is_vice")),
                    records_visible=uid in visible_ids,
                    today_chars=today_by_user.get(uid, 0),
                    last_seen_at=_parse_dt(m.get("last_seen_at")),
                )
            )
        return info, members

    def touch_last_seen(self, room_id: str) -> None:
        self._api.web_rpc("touchLastSeen", [room_id])

    def set_work_status(self, room_id: str, status: str | None) -> None:
        self._api.web_rpc("setWorkStatus", [room_id, status])

    # ── 채팅 ───────────────────────────────────────────────────
    _MESSAGE_COLUMNS = "id,user_id,content,created_at,target_user_id,image_path"

    def fetch_messages(self, room_id: str) -> list[ChatMessage]:
        rows = self._api.select(
            "chat_messages",
            self._MESSAGE_COLUMNS,
            {"room_id": f"eq.{room_id}"},
            order="created_at.desc",
            limit=50,
        )
        return [ChatMessage.from_row(r) for r in reversed(rows)]

    def fetch_message(self, message_id: str) -> ChatMessage | None:
        row = self._api.select("chat_messages", self._MESSAGE_COLUMNS, {"id": f"eq.{message_id}"}, single=True)
        return ChatMessage.from_row(row) if row else None

    def send_message(self, room_id: str, content: str) -> ChatMessage | None:
        row = self._api.insert(
            "chat_messages",
            {"room_id": room_id, "user_id": self.user_id, "content": content, "target_user_id": None},
            returning=self._MESSAGE_COLUMNS,
        )
        return ChatMessage.from_row(row) if row else None

    def delete_message(self, message_id: str) -> bool:
        try:
            self._api.delete("chat_messages", {"id": f"eq.{message_id}"})
            return True
        except ApiError:
            return False

    # ── 기록 ───────────────────────────────────────────────────
    def record_focus(self, room_id: str, delta: int, date: str, revalidate: bool = False) -> None:
        self._api.web_rpc("recordFocusMinutes", [room_id, delta, date, revalidate])

    def record_break(self, room_id: str, delta: int, date: str) -> None:
        self._api.web_rpc("recordBreakMinutes", [room_id, delta, date])

    # ── 캐릭터 이미지 ──────────────────────────────────────────
    def character_bytes(self, character_id: str) -> bytes | None:
        safe = "".join(ch for ch in character_id if ch.isalnum() or ch in "_-")
        path = self._cache_dir / f"{safe}.png"
        if path.exists():
            try:
                return path.read_bytes()
            except OSError:
                pass
        data = self._api.get_bytes(f"{self._config.web_url}/characters/{safe}.png")
        if data:
            try:
                path.write_bytes(data)
            except OSError:
                pass
        return data


class PreviewRepository:
    """서버 없이 화면 모양만 볼 때 쓰는 예시 데이터."""

    user_id = "preview-user"

    def __init__(self) -> None:
        self._messages: list[ChatMessage] = []
        now = datetime.now(timezone.utc)

        def ts(minutes_ago: int) -> str:
            return (now - timedelta(minutes=minutes_ago)).isoformat()

        self._messages = [
            ChatMessage("m1", "u2", "오늘 마감 가즈아! 다들 화이팅 💪", ts(12)),
            ChatMessage("m2", self.user_id, "저는 3천자 목표예요. 커피 한잔하고 시작합니다 ☕", ts(10)),
            ChatMessage("m3", "u3", "콘티 한 컷만 더 그리고 휴식!", ts(4)),
            ChatMessage("m4", "u2", "25분 집중 끝나면 같이 쉬어요", ts(1)),
        ]

    def fetch_profile(self) -> Profile | None:
        return Profile(id=self.user_id, name="미리보기", character_id="char_0001", position="novelist")

    def mark_attendance(self) -> None:
        return None

    def fetch_rooms(self) -> list[RoomSummary]:
        return [
            RoomSummary("p1", "마감 달리는 방", "rose", False, "open", 4, True, 8, ["웹소설", "마감"]),
            RoomSummary("p2", "새벽 집필반", "sky", True, "open", 12, True, 50, ["새벽"]),
            RoomSummary("p3", "웹툰 콘티 모임", "violet-deep", False, "open", 3, False, 6, ["웹툰"]),
            RoomSummary("p4", "조용히 쓰는 방", "emerald", False, "open", 2, False, None, ["웹소설"]),
            RoomSummary("p5", "초대 전용 작업방", "amber", False, "invite", 5, False, None, ["웹소설"]),
        ]

    def join_system_room(self, kind: str) -> str | None:
        return "p2"

    def join_open_room(self, room_id: str) -> bool:
        return True

    def leave_room(self, room_id: str) -> None:
        return None

    def fetch_room(self, room_id: str) -> tuple[RoomInfo, list[RoomMember]] | None:
        info = RoomInfo(room_id, "마감 달리는 방", "rose", "open", False, self.user_id, "shared", 8)
        now = datetime.now(timezone.utc)
        members = [
            RoomMember(self.user_id, "미리보기", "novelist", "char_0001", "rose", "집필중", True, False, True, 3420, now),
            RoomMember("u2", "하루", "novelist", "char_0007", "sky", "퇴고중", False, True, True, 5120, now - timedelta(minutes=2)),
            RoomMember("u3", "달빛", "webtoon", "char_0012", "emerald", None, False, False, True, 12, now - timedelta(hours=5)),
            RoomMember("u4", "글쓰는곰", "novelist", "char_0020", None, None, False, False, False, 0, None),
        ]
        return info, members

    def touch_last_seen(self, room_id: str) -> None:
        return None

    def set_work_status(self, room_id: str, status: str | None) -> None:
        return None

    def fetch_messages(self, room_id: str) -> list[ChatMessage]:
        return list(self._messages)

    def fetch_message(self, message_id: str) -> ChatMessage | None:
        return next((m for m in self._messages if m.id == message_id), None)

    def send_message(self, room_id: str, content: str) -> ChatMessage | None:
        msg = ChatMessage(f"m{len(self._messages) + 1}", self.user_id, content, datetime.now(timezone.utc).isoformat())
        self._messages.append(msg)
        return msg

    def delete_message(self, message_id: str) -> bool:
        self._messages = [m for m in self._messages if m.id != message_id]
        return True

    def record_focus(self, room_id: str, delta: int, date: str, revalidate: bool = False) -> None:
        return None

    def record_break(self, room_id: str, delta: int, date: str) -> None:
        return None

    def character_bytes(self, character_id: str) -> bytes | None:
        return None
