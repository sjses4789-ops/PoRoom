"""/api/app/home 응답(웹 route.ts가 돌려주는 모양)을 화면용 데이터로 바꾸는 부분 시험:  python tests/test_home_parse.py"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from poroom.repo import _HomeMixin  # noqa: E402

BODY = {
    "ok": True,
    "position": "webtoon",
    "rooms": [
        {"id": "r1", "name": "방1", "memberCount": 3, "color": "rose", "tags": ["웹툰"], "joinType": "open", "targetPosition": "webtoon",
         "isMember": True, "isFavorite": True, "inviteCode": "ABC123", "createdAt": "2026-01-01", "allTimeChars": 1200, "monthChars": 300},
    ],
    "systemRooms": {"deadline": {"count": 5, "isMember": True}, "dawn": {"count": 0, "isMember": False}, "capacity": 50},
    "dashboard": {
        "todayChars": 10, "monthGoalChars": 100, "monthProgressChars": 40, "overallRank": 2, "totalUsers": 9, "streakDays": 3,
        "year": 2026, "month": 10, "attendedDates": ["2026-10-01", "2026-10-02"], "todos": [{"id": "t1", "content": "쓰기"}],
    },
}


class FakeApi:
    def get_json(self, path: str) -> dict:
        assert path == "home"
        return BODY


class Repo(_HomeMixin):
    def __init__(self) -> None:
        self._api = FakeApi()  # type: ignore[assignment]
        self.user_id = "me"


def main() -> int:
    data = Repo().fetch_home()
    room = data.rooms[0]
    assert data.position == "webtoon" and room.is_favorite and room.invite_code == "ABC123" and room.all_time_chars == 1200
    assert data.deadline_count == 5 and data.deadline_member and data.dawn_count == 0 and data.system_capacity == 50
    d = data.dashboard
    assert d.today_chars == 10 and d.overall_rank == 2 and d.attended_dates == {"2026-10-01", "2026-10-02"} and d.todos[0].content == "쓰기"
    print("home parse 시험 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
