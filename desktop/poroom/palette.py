"""웹 방 색상 팔레트(src/lib/palette.ts)와 같은 색 — 키가 '-deep'으로 끝나면 더 진한 톤."""
from __future__ import annotations

BASE = {
    "neutral": "#737373", "slate": "#64748B", "zinc": "#71717A", "stone": "#78716C",
    "red": "#EF4444", "rose": "#F43F5E", "pink": "#EC4899", "fuchsia": "#D946EF",
    "purple": "#A855F7", "violet": "#8B5CF6", "indigo": "#6366F1", "blue": "#3B82F6",
    "sky": "#0EA5E9", "cyan": "#06B6D4", "teal": "#14B8A6", "emerald": "#10B981",
    "green": "#22C55E", "lime": "#84CC16", "yellow": "#EAB308", "amber": "#F59E0B",
    "orange": "#F97316", "gray": "#6B7280", "black": "#171717",
}

BRAND = "#C17B7B"  # PoRoom 시그니처 색(뽀모도로 집중 색)
BREAK_BLUE = "#7B93C1"


def _blend(hex_color: str, factor: float) -> str:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    r, g, b = (int(c * (1 - factor)) for c in (r, g, b))
    return f"#{r:02X}{g:02X}{b:02X}"


def room_color(key: str) -> str:
    deep = key.endswith("-deep")
    base = BASE.get(key[:-5] if deep else key, BASE["neutral"])
    return _blend(base, 0.33) if deep else base


def tint(hex_color: str, amount: float = 0.1) -> str:
    """연한 배경색(흰색에 가깝게 섞는다)."""
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    r, g, b = (int(c + (255 - c) * (1 - amount)) for c in (r, g, b))
    return f"#{r:02X}{g:02X}{b:02X}"


# ── 방 색상 팔레트(웹 src/lib/palette.ts의 PALETTE와 같은 22색) ─────────────────────────
# (키, 이름, 점 색(500), 카드 바탕(50 — 회색 계열은 100))
PALETTE = [
    ("neutral", "회색", "#737373", "#F5F5F5"),
    ("slate", "슬레이트", "#64748B", "#F1F5F9"),
    ("zinc", "징크", "#71717A", "#F4F4F5"),
    ("stone", "스톤", "#78716C", "#F5F5F4"),
    ("red", "빨강", "#EF4444", "#FEF2F2"),
    ("rose", "장미", "#F43F5E", "#FFF1F2"),
    ("pink", "분홍", "#EC4899", "#FDF2F8"),
    ("fuchsia", "자홍", "#D946EF", "#FDF4FF"),
    ("purple", "보라", "#A855F7", "#FAF5FF"),
    ("violet", "바이올렛", "#8B5CF6", "#F5F3FF"),
    ("indigo", "인디고", "#6366F1", "#EEF2FF"),
    ("blue", "파랑", "#3B82F6", "#EFF6FF"),
    ("sky", "하늘", "#0EA5E9", "#F0F9FF"),
    ("cyan", "시안", "#06B6D4", "#ECFEFF"),
    ("teal", "청록", "#14B8A6", "#F0FDFA"),
    ("emerald", "에메랄드", "#10B981", "#ECFDF5"),
    ("green", "초록", "#22C55E", "#F0FDF4"),
    ("lime", "연두", "#84CC16", "#F7FEE7"),
    ("yellow", "노랑", "#EAB308", "#FEFCE8"),
    ("amber", "호박", "#F59E0B", "#FFFBEB"),
    ("orange", "주황", "#F97316", "#FFF7ED"),
    ("gray", "그레이", "#6B7280", "#F3F4F6"),
]
_BY_KEY = {p[0]: p for p in PALETTE}


def palette_dot(key: str) -> str:
    return _BY_KEY.get(key, PALETTE[0])[2]


def palette_card(key: str) -> str:
    return _BY_KEY.get(key, PALETTE[0])[3]
