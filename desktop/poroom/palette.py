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
