"""웹 PoRoom의 치수 체계를 그대로 옮긴 값 — 글꼴·글자 크기·여백·모서리.

웹(globals.css)은 html 글자 크기를 17px로 키워 두었고(Tailwind의 rem 기반 글자 크기·여백이 전부 17/16배),
body 글꼴은 Arial이다(한글은 Arial에 글자가 없어 윈도우에서는 맑은 고딕으로 대체된다).
모서리 반경도 줄여 두었다(rounded-md ≈ 3px, rounded-lg ≈ 4px, rounded-xl ≈ 6px — 거의 직각).
"""
from __future__ import annotations

REM = 17.0  # html { font-size: 17px }

FONT_FAMILY = '"Arial", "Malgun Gothic", "Noto Sans KR", sans-serif'

# Tailwind 글자 크기(rem 기반) — 괄호 없는 text-xs/sm/base ... 는 17px 기준으로 커진다. text-[12px] 처럼 px로 적은 건 그대로.
TEXT_PX = {
    "xs": 0.75 * REM,  # 12.75
    "sm": 0.875 * REM,  # 14.875
    "base": REM,  # 17
    "lg": 1.125 * REM,  # 19.125
    "xl": 1.25 * REM,  # 21.25
    "2xl": 1.5 * REM,  # 25.5
}

# 모서리(globals.css의 @theme 반경 스케일)
RADIUS = {"sm": 2, "md": 3, "lg": 4, "xl": 6, "2xl": 9, "full": 999}


def sp(n: float) -> int:
    """Tailwind 간격 단위(p-4, gap-3 ...) → px. 1단위 = 0.25rem = 4.25px."""
    return round(n * 0.25 * REM)


def pt(px: float) -> str:
    """스타일시트용 글자 크기. Qt 스타일시트의 px는 정수로 반올림되므로, 소수 크기는 pt(= px × 0.75)로 정확히 적는다."""
    return f"{px * 0.75:.2f}pt"


def fs(size: str | float) -> str:
    """font-size 스타일 한 조각. fs("sm") → 'font-size: 11.16pt;', fs(12) → text-[12px]."""
    px = TEXT_PX[size] if isinstance(size, str) else float(size)
    return f"font-size: {pt(px)};"


# 글자 굵기 — Arial에는 500이 없어 웹에서도 font-medium은 보통 굵기로 보이고, font-semibold(600)는 굵게 보인다.
NORMAL = "font-weight: 400;"
MEDIUM = "font-weight: 400;"
SEMIBOLD = "font-weight: 700;"
BOLD = "font-weight: 700;"

# 색(Tailwind neutral)
N50, N100, N200, N300, N400, N500, N600, N700, N800, N900 = (
    "#FAFAFA", "#F5F5F5", "#E5E5E5", "#D4D4D4", "#A3A3A3", "#737373", "#525252", "#404040", "#262626", "#171717",
)
