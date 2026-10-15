"""창 테두리·제목 줄 — 윈도우 기본 제목 줄 대신 웹 PoRoom의 헤더와 같은 모양의 제목 줄을 직접 그린다.

기본 틀(Frameless) 창이라 이동·크기 조절·최대화는 Qt가 운영체제 기능(startSystemMove/startSystemResize)에 맡겨서
윈도우 기본 창과 똑같이 움직인다(화면 가장자리로 끌어 붙이기 포함).
"""
from __future__ import annotations

import sys
from pathlib import Path

from PySide6.QtCore import QPoint, Qt
from PySide6.QtGui import QFont, QIcon, QMouseEvent
from PySide6.QtWidgets import QFrame, QHBoxLayout, QLabel, QPushButton, QVBoxLayout, QWidget

from ..config import app_dir

RESIZE_MARGIN = 6


def resource_path(name: str) -> str:
    """assets 폴더의 파일 경로(exe로 묶였을 때도 찾는다)."""
    base = Path(getattr(sys, "_MEIPASS", "")) if getattr(sys, "frozen", False) else app_dir()
    return str(base / "assets" / name)


def app_icon() -> QIcon:
    return QIcon(resource_path("poroom-square.png"))


class WindowButton(QPushButton):
    def __init__(self, text: str, kind: str = "normal", parent: QWidget | None = None) -> None:
        super().__init__(text, parent)
        self.setObjectName("winclose" if kind == "close" else "winbtn")
        self.setFixedSize(44, 36)
        self.setCursor(Qt.ArrowCursor)
        self.setFocusPolicy(Qt.NoFocus)


class TitleBar(QWidget):
    """웹 헤더처럼: 로고 · 메뉴 탭 · (빈 곳은 끌어서 창 이동) · 사용자 영역 · 창 버튼."""

    def __init__(self, window: QWidget, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._window = window
        self.setObjectName("topbar")
        self.setFixedHeight(66)  # 웹 헤더: py-4 + 탭 높이
        self.layout_ = QHBoxLayout(self)
        self.layout_.setContentsMargins(34, 0, 0, 0)  # 웹 헤더 px-8
        self.layout_.setSpacing(4)

        logo = QLabel()
        logo.setPixmap(app_icon().pixmap(24, 24))
        logo.setFixedSize(24, 24)
        brand = QLabel("PoRoom")
        brand.setObjectName("brand")
        brand_font = brand.font()
        brand_font.setLetterSpacing(QFont.AbsoluteSpacing, -0.37)  # tracking-tight
        brand.setFont(brand_font)
        self.layout_.addWidget(logo)
        self.layout_.addSpacing(4)
        self.layout_.addWidget(brand)
        self.layout_.addSpacing(30)  # 웹 gap-8

        # 창 버튼(맨 오른쪽)
        self._min = WindowButton("—")
        self._max = WindowButton("▢")
        self._close = WindowButton("✕", "close")
        self._min.clicked.connect(window.showMinimized)
        self._max.clicked.connect(self.toggle_maximize)
        self._close.clicked.connect(window.close)

    def finish(self) -> None:
        """앞쪽 내용을 다 넣은 뒤 창 버튼을 맨 오른쪽에 붙인다."""
        self.layout_.addSpacing(10)
        for btn in (self._min, self._max, self._close):
            self.layout_.addWidget(btn, 0, Qt.AlignTop)

    def toggle_maximize(self) -> None:
        if self._window.isMaximized():
            self._window.showNormal()
            self._max.setText("▢")
        else:
            self._window.showMaximized()
            self._max.setText("❐")

    def mousePressEvent(self, event: QMouseEvent) -> None:  # noqa: N802
        if event.button() == Qt.LeftButton:
            handle = self._window.windowHandle()
            if handle is not None:
                handle.startSystemMove()
        super().mousePressEvent(event)

    def mouseDoubleClickEvent(self, event: QMouseEvent) -> None:  # noqa: N802
        if event.button() == Qt.LeftButton:
            self.toggle_maximize()
        super().mouseDoubleClickEvent(event)


class FramelessMixin:
    """가장자리를 끌어 크기를 조절하게 한다(창 둘레 6px 여백이 마우스를 받는다)."""

    def _edges_at(self, pos: QPoint) -> Qt.Edges:
        w: QWidget = self  # type: ignore[assignment]
        if w.isMaximized():
            return Qt.Edges()
        edges = Qt.Edges()
        if pos.x() <= RESIZE_MARGIN:
            edges |= Qt.LeftEdge
        if pos.x() >= w.width() - RESIZE_MARGIN:
            edges |= Qt.RightEdge
        if pos.y() <= RESIZE_MARGIN:
            edges |= Qt.TopEdge
        if pos.y() >= w.height() - RESIZE_MARGIN:
            edges |= Qt.BottomEdge
        return edges

    def _cursor_for(self, edges: Qt.Edges) -> Qt.CursorShape:
        horizontal = bool(edges & (Qt.LeftEdge | Qt.RightEdge))
        vertical = bool(edges & (Qt.TopEdge | Qt.BottomEdge))
        if horizontal and vertical:
            diagonal_back = (edges & Qt.LeftEdge and edges & Qt.TopEdge) or (edges & Qt.RightEdge and edges & Qt.BottomEdge)
            return Qt.SizeFDiagCursor if diagonal_back else Qt.SizeBDiagCursor
        if horizontal:
            return Qt.SizeHorCursor
        if vertical:
            return Qt.SizeVerCursor
        return Qt.ArrowCursor

    def mouseMoveEvent(self, event: QMouseEvent) -> None:  # noqa: N802
        w: QWidget = self  # type: ignore[assignment]
        w.setCursor(self._cursor_for(self._edges_at(event.position().toPoint())))
        QWidget.mouseMoveEvent(w, event)

    def mousePressEvent(self, event: QMouseEvent) -> None:  # noqa: N802
        w: QWidget = self  # type: ignore[assignment]
        if event.button() == Qt.LeftButton:
            edges = self._edges_at(event.position().toPoint())
            handle = w.window().windowHandle()
            if edges and handle is not None:
                handle.startSystemResize(edges)
                return
        QWidget.mousePressEvent(w, event)


class ChromeRoot(FramelessMixin, QWidget):
    """창 전체를 감싸는 바탕 — 둘레 여백이 크기 조절 손잡이가 되고, 안쪽 틀(frame)이 1px 테두리를 가진다."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("root")
        self.setMouseTracking(True)
        outer = QVBoxLayout(self)
        outer.setContentsMargins(RESIZE_MARGIN, RESIZE_MARGIN, RESIZE_MARGIN, RESIZE_MARGIN)
        outer.setSpacing(0)
        self.frame = QFrame()
        self.frame.setObjectName("chrome")
        outer.addWidget(self.frame)
        self.body = QVBoxLayout(self.frame)
        self.body.setContentsMargins(0, 0, 0, 0)
        self.body.setSpacing(0)

    def set_maximized(self, maximized: bool) -> None:
        margin = 0 if maximized else RESIZE_MARGIN
        self.layout().setContentsMargins(margin, margin, margin, margin)
        self.frame.setProperty("maximized", maximized)
        self.frame.style().unpolish(self.frame)
        self.frame.style().polish(self.frame)
