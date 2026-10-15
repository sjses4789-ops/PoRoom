"""화면 색·글꼴 — 웹 PoRoom과 같은 분위기(흰 바탕 · Tailwind neutral 회색 · 검정 버튼 · 작은 둥근 모서리)."""
from __future__ import annotations

from PySide6.QtGui import QColor

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


STYLESHEET = f"""
* {{
    font-family: "Segoe UI", "Malgun Gothic", "Noto Sans KR", sans-serif;
    font-size: 13px;
    color: {TEXT};
}}
QMainWindow {{ background: {BG}; }}
QWidget#root {{ background: transparent; }}
QFrame#chrome {{ background: {BG}; border: 1px solid #D4D4D4; }}
QFrame#chrome[maximized="true"] {{ border: none; }}
QWidget#page {{ background: {BG}; }}
QLabel#title {{ font-size: 20px; font-weight: 700; }}
QLabel#heading {{ font-size: 15px; font-weight: 600; }}
QLabel#muted {{ color: {MUTED}; font-size: 12px; }}
QLabel#sub {{ color: {SUBTEXT}; }}

/* 웹 헤더와 같은 모양: 흰 바탕, 아래 얇은 선, 둥근 모서리 작은 탭(선택된 탭은 검정) */
QWidget#topbar {{ background: {BG}; border-bottom: 1px solid #F0F0F0; }}
QLabel#brand {{ font-size: 15px; font-weight: 700; }}
QPushButton#tab {{
    border: none; border-radius: 6px; padding: 6px 12px; background: transparent;
    color: #737373; font-size: 13px; font-weight: 500;
}}
QPushButton#tab:hover {{ background: #F5F5F5; }}
QPushButton#tab:checked {{ background: {TEXT}; color: white; }}
QPushButton#icon {{
    border: none; border-radius: 6px; padding: 4px 8px; background: transparent; font-size: 15px; color: #737373;
}}
QPushButton#icon:hover {{ background: #F5F5F5; }}
QPushButton#icon:disabled {{ color: #C4C4C4; }}
QPushButton#userlink {{
    border: none; background: transparent; font-weight: 700; padding: 4px 6px; border-radius: 6px;
}}
QPushButton#userlink:hover {{ background: #F5F5F5; }}
QPushButton#textbtn {{
    border: none; background: transparent; color: #737373; padding: 4px 8px; border-radius: 6px;
}}
QPushButton#textbtn:hover {{ background: #F5F5F5; color: {TEXT}; }}
QPushButton#winbtn, QPushButton#winclose {{
    border: none; border-radius: 0; background: transparent; color: #525252; font-size: 13px; padding: 0;
}}
QPushButton#winbtn:hover {{ background: #F0F0F0; }}
QPushButton#winclose:hover {{ background: #E81123; color: white; }}

QFrame#card, QWidget#card {{
    background: {SURFACE};
    border: 1px solid {LINE};
    border-radius: 8px;
}}
QFrame#cardAlt {{
    background: {SURFACE_ALT};
    border: 1px solid {LINE};
    border-radius: 8px;
}}

QPushButton {{
    border: 1px solid {LINE}; border-radius: 6px; padding: 6px 14px; background: {SURFACE}; font-weight: 500;
}}
QPushButton:hover {{ background: #F5F5F5; }}
QPushButton:disabled {{ color: {MUTED}; }}
QPushButton#primary, QPushButton#dark {{
    background: {TEXT}; color: white; border: none; font-weight: 600;
}}
QPushButton#primary:hover, QPushButton#dark:hover {{ background: #404040; }}
QPushButton#primary:disabled, QPushButton#dark:disabled {{ background: #A3A3A3; color: white; }}
QPushButton#google {{
    background: #F1DCDC; color: #7A4A4A; border: none; font-weight: 600; border-radius: 6px;
}}
QPushButton#google:hover {{ background: #E9CCCC; }}
QPushButton#google:disabled {{ background: #F6EAEA; color: #BFA3A3; }}

QLineEdit, QPlainTextEdit, QTextEdit, QSpinBox {{
    border: 1px solid {LINE}; border-radius: 6px; padding: 7px 10px; background: {SURFACE};
    selection-background-color: {BRAND_SOFT}; selection-color: {TEXT};
}}
QLineEdit:focus, QPlainTextEdit:focus, QSpinBox:focus {{ border: 1px solid #A3A3A3; }}

QScrollArea {{ border: none; background: transparent; }}
QScrollBar:vertical {{ width: 10px; background: transparent; margin: 2px; }}
QScrollBar::handle:vertical {{ background: #D4D4D4; border-radius: 4px; min-height: 30px; }}
QScrollBar::handle:vertical:hover {{ background: #BDBDBD; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
QScrollBar:horizontal {{ height: 0; }}

QToolTip {{ border: 1px solid {LINE}; background: {SURFACE}; padding: 4px 8px; }}
"""
