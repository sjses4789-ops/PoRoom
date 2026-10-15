"""화면과 데이터 계층이 같이 쓰는 데이터 모양."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))


def today_kst() -> str:
    return datetime.now(KST).strftime("%Y-%m-%d")


@dataclass
class Profile:
    id: str
    name: str | None = None
    character_id: str | None = None
    position: str | None = None  # novelist | webtoon
    is_banned: bool = False
    timezone: str | None = None

    @property
    def is_complete(self) -> bool:
        return bool(self.name) and self.position is not None


@dataclass
class RoomSummary:
    id: str
    name: str
    color: str = "neutral"
    is_system: bool = False
    join_type: str = "invite"  # open | invite
    member_count: int = 0
    is_member: bool = False
    capacity: int | None = None
    tags: list[str] = field(default_factory=list)
    target_position: str | None = None

    @property
    def is_open(self) -> bool:
        return self.join_type == "open"


@dataclass
class RoomInfo:
    id: str
    name: str
    color: str
    join_type: str
    is_system: bool
    owner_id: str
    record_visibility: str  # shared | private | free
    capacity: int | None = None


@dataclass
class RoomMember:
    id: str
    name: str
    position: str = "novelist"
    character_id: str | None = None
    chat_color: str | None = None
    work_status: str | None = None
    is_owner: bool = False
    is_vice: bool = False
    records_visible: bool = True
    today_chars: int = 0
    last_seen_at: datetime | None = None


@dataclass
class ChatMessage:
    id: str
    user_id: str
    content: str
    created_at: str
    target_user_id: str | None = None
    image_path: str | None = None

    @staticmethod
    def from_row(row: dict) -> "ChatMessage":
        return ChatMessage(
            id=row["id"],
            user_id=row["user_id"],
            content=row.get("content") or "",
            created_at=row.get("created_at") or "",
            target_user_id=row.get("target_user_id"),
            image_path=row.get("image_path"),
        )


@dataclass
class Presence:
    """한 참여자의 접속 상태(웹의 PresencePayload와 같은 필드)."""

    name: str = ""
    last_typed_at: float | None = None  # epoch ms
    pomodoro_phase: str = "idle"  # idle | focus | break
    pomodoro_progressing: bool = False
    pomodoro_elapsed_fraction: float = 0.0
    pomodoro_snapshot_at: float = 0.0  # epoch ms
    pomodoro_duration_seconds: float = 0.0
    screen_sharing: bool | None = None

    @staticmethod
    def from_meta(meta: dict) -> "Presence":
        return Presence(
            name=str(meta.get("name") or ""),
            last_typed_at=meta.get("lastTypedAt"),
            pomodoro_phase=str(meta.get("pomodoroPhase") or "idle"),
            pomodoro_progressing=bool(meta.get("pomodoroProgressing")),
            pomodoro_elapsed_fraction=float(meta.get("pomodoroElapsedFraction") or 0.0),
            pomodoro_snapshot_at=float(meta.get("pomodoroSnapshotAt") or 0.0),
            pomodoro_duration_seconds=float(meta.get("pomodoroDurationSeconds") or 0.0),
            screen_sharing=meta.get("screenSharing"),
        )


@dataclass
class RoomItem:
    """[포룸] 방 목록의 방 하나(웹의 RoomListItem)."""

    id: str
    name: str
    member_count: int = 0
    color: str = "neutral"
    tags: list[str] = field(default_factory=list)
    join_type: str = "invite"  # open | invite
    target_position: str | None = None
    is_member: bool = False
    is_favorite: bool = False
    invite_code: str | None = None
    created_at: str = ""
    all_time_chars: int = 0
    month_chars: int = 0


@dataclass
class Todo:
    id: str
    content: str


@dataclass
class Dashboard:
    today_chars: int = 0
    month_goal_chars: int = 0
    month_progress_chars: int = 0
    overall_rank: int = 1
    total_users: int = 0
    streak_days: int = 0
    year: int = 0
    month: int = 0  # 1~12
    attended_dates: set[str] = field(default_factory=set)
    todos: list[Todo] = field(default_factory=list)


@dataclass
class HomeData:
    position: str = "novelist"
    rooms: list[RoomItem] = field(default_factory=list)
    deadline_count: int = 0
    deadline_member: bool = False
    dawn_count: int = 0
    dawn_member: bool = False
    system_capacity: int = 50
    dashboard: Dashboard = field(default_factory=Dashboard)


@dataclass
class NicknameContext:
    default_name: str
    nicknames: list[tuple[str, str]]  # (id, nickname)


@dataclass
class TodoHistoryItem:
    id: str
    content: str
    completed: bool
