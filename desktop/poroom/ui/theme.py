"""화면 색·글꼴 — 웹·앱과 같은 분위기(Tailwind neutral 회색 + PoRoom 시그니처 색)."""
from __future__ import annotations

from PySide6.QtGui import QColor

BRAND = "#C17B7B"
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
    font-family: "Malgun Gothic", "Segoe UI", "Noto Sans KR", sans-serif;
    font-size: 13px;
    color: {TEXT};
}}
QMainWindow, QWidget#root {{ background: {BG}; }}
QWidget#page {{ background: {BG}; }}
QLabel#title {{ font-size: 20px; font-weight: 800; }}
QLabel#heading {{ font-size: 15px; font-weight: 700; }}
QLabel#muted {{ color: {MUTED}; font-size: 12px; }}
QLabel#sub {{ color: {SUBTEXT}; }}

QFrame#card, QWidget#card {{
    background: {SURFACE};
    border: 1px solid {LINE};
    border-radius: 14px;
}}
QFrame#cardAlt {{
    background: {SURFACE_ALT};
    border: 1px solid {LINE};
    border-radius: 14px;
}}

QWidget#sidebar {{ background: {SURFACE_ALT}; border-right: 1px solid {LINE}; }}
QPushButton#nav {{
    text-align: left; padding: 10px 14px; border: none; border-radius: 10px;
    color: {SUBTEXT}; font-weight: 600; background: transparent;
}}
QPushButton#nav:hover {{ background: #F0F0F0; }}
QPushButton#nav:checked {{ background: {BRAND_SOFT}; color: {BRAND}; }}

QWidget#topbar {{ background: {BG}; border-bottom: 1px solid {LINE}; }}
QPushButton#icon {{
    border: none; border-radius: 10px; padding: 6px 10px; background: transparent; font-size: 16px;
}}
QPushButton#icon:hover {{ background: #F0F0F0; }}

QPushButton {{
    border: 1px solid {LINE}; border-radius: 10px; padding: 7px 14px; background: {SURFACE};
}}
QPushButton:hover {{ background: #F5F5F5; }}
QPushButton:disabled {{ color: {MUTED}; }}
QPushButton#primary {{
    background: {BRAND}; color: white; border: none; font-weight: 700;
}}
QPushButton#primary:hover {{ background: #B06A6A; }}
QPushButton#primary:disabled {{ background: #DDBFBF; color: white; }}
QPushButton#dark {{
    background: {TEXT}; color: white; border: none; font-weight: 700;
}}
QPushButton#dark:hover {{ background: #333333; }}

QLineEdit, QPlainTextEdit, QTextEdit {{
    border: 1px solid {LINE}; border-radius: 10px; padding: 8px 10px; background: {SURFACE};
    selection-background-color: {BRAND_SOFT}; selection-color: {TEXT};
}}
QLineEdit:focus, QPlainTextEdit:focus {{ border: 1px solid {BRAND}; }}

QScrollArea {{ border: none; background: transparent; }}
QScrollBar:vertical {{ width: 10px; background: transparent; margin: 2px; }}
QScrollBar::handle:vertical {{ background: #D4D4D4; border-radius: 4px; min-height: 30px; }}
QScrollBar::handle:vertical:hover {{ background: #BDBDBD; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
QScrollBar:horizontal {{ height: 0; }}

QToolTip {{ border: 1px solid {LINE}; background: {SURFACE}; padding: 4px 8px; }}
"""
