"""화면 색·글꼴 — 웹 PoRoom과 같은 값(Arial, Tailwind neutral, 17px 기준 글자 크기, 거의 직각인 모서리)."""
from __future__ import annotations

from PySide6.QtGui import QColor

from .scale import FONT_FAMILY, RADIUS, fs, sp

BRAND = "#C17B7B"  # 뽀모도로 집중 색(웹과 같다)
BRAND_SOFT = "#F6ECEC"
BREAK_BLUE = "#7B93C1"

BG = "#FFFFFF"
SURFACE = "#FFFFFF"
SURFACE_ALT = "#FAFAFA"
TEXT = "#171717"
SUBTEXT = "#525252"
MUTED = "#A3A3A3"
LINE = "#E5E5E5"
LINE_STRONG = "#171717"

STATUS_TYPING = "#10B981"
STATUS_IDLE = "#F59E0B"
STATUS_OFFLINE = "#D4D4D4"


def qcolor(hex_color: str) -> QColor:
    return QColor(hex_color)


R_MD, R_LG, R_XL = RADIUS["md"], RADIUS["lg"], RADIUS["xl"]

STYLESHEET = f"""
* {{
    font-family: {FONT_FAMILY};
    {fs("base")}
    color: {TEXT};
}}
QMainWindow {{ background: {BG}; }}
QWidget#root {{ background: transparent; }}
QFrame#chrome {{ background: {BG}; border: 1px solid #D4D4D4; }}
QFrame#chrome[maximized="true"] {{ border: none; }}
QWidget#page {{ background: {BG}; }}
QLabel#title {{ {fs("xl")} font-weight: 700; }}
QLabel#heading {{ {fs("sm")} font-weight: 700; }}
QLabel#muted {{ color: {MUTED}; {fs(12)} }}
QLabel#sub {{ color: {SUBTEXT}; {fs("sm")} }}

/* 웹 헤더: 흰 바탕 · 아래 얇은 선(neutral-100) · 거의 직각인 작은 탭(선택된 탭은 neutral-900) */
QWidget#topbar {{ background: {BG}; border-bottom: 1px solid #F5F5F5; }}
QLabel#brand {{ {fs("sm")} font-weight: 700; }}
QPushButton#tab {{
    border: none; border-radius: {R_MD}px; padding: {sp(1.5)}px {sp(3)}px; background: transparent;
    color: #737373; {fs("sm")} font-weight: 400;
}}
QPushButton#tab:hover {{ background: #F5F5F5; }}
QPushButton#tab:checked {{ background: {TEXT}; color: white; }}
QPushButton#icon {{
    border: none; border-radius: {R_MD}px; padding: {sp(1)}px {sp(2)}px; background: transparent; {fs("base")} color: #737373;
}}
QPushButton#icon:hover {{ background: #F5F5F5; }}
QPushButton#icon:disabled {{ color: #C4C4C4; }}
QPushButton#userlink {{
    border: none; background: transparent; font-weight: 700; {fs("sm")} padding: {sp(1)}px {sp(1.5)}px; border-radius: {R_MD}px;
}}
QPushButton#userlink:hover {{ background: #F5F5F5; }}
QPushButton#textbtn {{
    border: none; background: transparent; color: #737373; {fs("sm")} padding: {sp(1)}px {sp(2)}px; border-radius: {R_MD}px;
}}
QPushButton#textbtn:hover {{ background: #F5F5F5; color: {TEXT}; }}
QPushButton#winbtn, QPushButton#winclose {{
    border: none; border-radius: 0; background: transparent; color: #525252; {fs(13)} padding: 0;
}}
QPushButton#winbtn:hover {{ background: #F0F0F0; }}
QPushButton#winclose:hover {{ background: #E81123; color: white; }}

QFrame#card, QWidget#card {{
    background: {SURFACE};
    border: 1px solid {LINE};
    border-radius: {R_LG}px;
}}
QFrame#cardAlt {{
    background: {SURFACE_ALT};
    border: 1px solid {LINE};
    border-radius: {R_LG}px;
}}

QPushButton {{
    border: 1px solid {LINE}; border-radius: {R_MD}px; padding: {sp(1.5)}px {sp(3)}px; background: {SURFACE}; {fs("xs")} font-weight: 400;
    color: #404040;
}}
QPushButton:hover {{ background: #FAFAFA; }}
QPushButton:disabled {{ color: {MUTED}; }}
QPushButton#primary, QPushButton#dark {{
    background: {TEXT}; color: white; border: none; font-weight: 400;
}}
QPushButton#primary:hover, QPushButton#dark:hover {{ background: #404040; }}
QPushButton#primary:disabled, QPushButton#dark:disabled {{ background: #A3A3A3; color: white; }}
QPushButton#google {{
    background: #F1DCDC; color: #7A4A4A; border: none; font-weight: 400; border-radius: {R_MD}px; {fs("sm")}
}}
QPushButton#google:hover {{ background: #E9CCCC; }}
QPushButton#google:disabled {{ background: #F6EAEA; color: #BFA3A3; }}

QLineEdit, QPlainTextEdit, QTextEdit {{
    border: 1px solid {LINE}; border-radius: {R_MD}px; padding: {sp(1.5)}px {sp(2.5)}px; background: {SURFACE}; {fs("xs")}
    color: {TEXT}; selection-background-color: {BRAND_SOFT}; selection-color: {TEXT};
}}
QLineEdit:focus, QPlainTextEdit:focus {{ border: 1px solid #A3A3A3; }}

QScrollArea {{ border: none; background: transparent; }}
QScrollBar:vertical {{ width: 10px; background: transparent; margin: 2px; }}
QScrollBar::handle:vertical {{ background: #D4D4D4; border-radius: 4px; min-height: 30px; }}
QScrollBar::handle:vertical:hover {{ background: #BDBDBD; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
QScrollBar:horizontal {{ height: 0; }}

QToolTip {{ border: 1px solid {LINE}; background: {SURFACE}; padding: 4px 8px; {fs("xs")} }}
"""
