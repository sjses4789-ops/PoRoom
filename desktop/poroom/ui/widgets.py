"""여러 화면이 같이 쓰는 작은 부품들."""
from __future__ import annotations

import threading
from typing import Callable

from PySide6.QtCore import QObject, QPointF, QRectF, QSize, Qt, Signal
from PySide6.QtGui import QBrush, QColor, QFont, QPainter, QPainterPath, QPen, QPixmap
from PySide6.QtWidgets import QHBoxLayout, QLabel, QPushButton, QRadioButton, QWidget

from . import theme


class _Bridge(QObject):
    done = Signal(object, object)  # (결과, 오류)


def run_async(parent: QObject, fn: Callable[[], object], on_done: Callable[[object, Exception | None], None]) -> None:
    """네트워크처럼 오래 걸리는 일은 따로 돌리고, 끝나면 화면 스레드에서 on_done(결과, 오류)을 부른다."""
    bridge = _Bridge(parent)

    def finish(result: object, error: object) -> None:
        try:
            on_done(result, error if isinstance(error, Exception) else None)
        finally:
            bridge.deleteLater()

    bridge.done.connect(finish)

    def work() -> None:
        try:
            result = fn()
            bridge.done.emit(result, None)
        except Exception as exc:  # noqa: BLE001 - 화면에는 오류만 전달한다
            bridge.done.emit(None, exc)

    threading.Thread(target=work, daemon=True).start()


class Avatar(QWidget):
    """원형 프로필 사진(캐릭터). 이미지가 없으면 이모지."""

    def __init__(self, size: int = 40, ring_color: str | None = None, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._size = size
        self._pixmap: QPixmap | None = None
        self._ring = ring_color
        self.setFixedSize(size, size)

    def set_png(self, data: bytes | None) -> None:
        if data:
            pm = QPixmap()
            if pm.loadFromData(data):
                self._pixmap = pm
                self.update()
                return
        self._pixmap = None
        self.update()

    def set_ring(self, color: str | None) -> None:
        self._ring = color
        self.update()

    def paintEvent(self, _event) -> None:  # noqa: N802 (Qt API)
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        p.setRenderHint(QPainter.SmoothPixmapTransform)
        rect = QRectF(1, 1, self._size - 2, self._size - 2)
        path = QPainterPath()
        path.addEllipse(rect)
        p.setClipPath(path)
        p.fillRect(rect, QColor("#F5F5F5"))
        if self._pixmap is not None:
            scaled = self._pixmap.scaled(self._size, self._size, Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation)
            p.drawPixmap(
                int((self._size - scaled.width()) / 2), int((self._size - scaled.height()) / 2), scaled
            )
        else:
            p.setPen(QColor("#D4D4D4"))
            font = QFont(self.font())
            font.setPixelSize(int(self._size * 0.5))
            p.setFont(font)
            p.drawText(rect, Qt.AlignCenter, "🙂")
        p.setClipping(False)
        p.setPen(QPen(QColor(self._ring or "#E5E5E5"), 2 if self._ring else 1))
        p.setBrush(Qt.NoBrush)
        p.drawEllipse(rect)


class DonutRing(QWidget):
    """뽀모도로 진행 링 — 가운데에 시간/문구를 그린다."""

    def __init__(self, size: int = 160, thickness: int = 12, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._fraction = 0.0
        self._color = theme.BRAND
        self._center = "25:00"
        self._caption = ""
        self._thickness = thickness
        self.setFixedSize(size, size)

    def set_state(self, fraction: float, color: str, center: str, caption: str = "") -> None:
        self._fraction = max(0.0, min(1.0, fraction))
        self._color = color
        self._center = center
        self._caption = caption
        self.update()

    def sizeHint(self) -> QSize:  # noqa: N802
        return self.size()

    def paintEvent(self, _event) -> None:  # noqa: N802
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        t = self._thickness
        rect = QRectF(t / 2, t / 2, self.width() - t, self.height() - t)
        p.setPen(QPen(QColor("#EEEEEE"), t, Qt.SolidLine, Qt.RoundCap))
        p.drawArc(rect, 0, 360 * 16)
        if self._fraction > 0:
            p.setPen(QPen(QColor(self._color), t, Qt.SolidLine, Qt.RoundCap))
            p.drawArc(rect, 90 * 16, int(-self._fraction * 360 * 16))
        p.setPen(QColor(theme.TEXT))
        font = QFont(self.font())
        font.setPixelSize(int(self.width() * 0.2))
        font.setBold(True)
        p.setFont(font)
        center_rect = QRectF(0, self.height() * 0.30, self.width(), self.height() * 0.28)
        p.drawText(center_rect, Qt.AlignCenter, self._center)
        if self._caption:
            font.setPixelSize(int(self.width() * 0.085))
            font.setBold(False)
            p.setFont(font)
            p.setPen(QColor(theme.MUTED))
            p.drawText(QRectF(0, self.height() * 0.58, self.width(), self.height() * 0.16), Qt.AlignCenter, self._caption)


class StatusDot(QWidget):
    def __init__(self, color: str = theme.STATUS_OFFLINE, size: int = 10, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._color = color
        self.setFixedSize(size, size)

    def set_color(self, color: str) -> None:
        self._color = color
        self.update()

    def paintEvent(self, _event) -> None:  # noqa: N802
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        p.setPen(Qt.NoPen)
        p.setBrush(QBrush(QColor(self._color)))
        p.drawEllipse(QPointF(self.width() / 2, self.height() / 2), self.width() / 2 - 0.5, self.height() / 2 - 0.5)


def elide(label: QLabel, text: str, width: int) -> None:
    label.setText(label.fontMetrics().elidedText(text, Qt.ElideRight, width))


class Stepper(QWidget):
    """[−] 값 [+] — 분 단위 설정처럼 작은 숫자를 올리고 내리는 부품(윈도우 기본 스핀박스는 웹 모양과 어울리지 않아 직접 만들었다)."""

    value_changed = Signal(int)

    def __init__(self, value: int, minimum: int, maximum: int, suffix: str = "", parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._min, self._max, self._value, self._suffix = minimum, maximum, value, suffix
        lay = QHBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(4)
        self._minus = QPushButton("−")
        self._plus = QPushButton("+")
        for btn in (self._minus, self._plus):
            btn.setFixedSize(26, 26)
            btn.setStyleSheet("padding: 0; font-size: 15px;")
            btn.setCursor(Qt.PointingHandCursor)
        self._label = QLabel()
        self._label.setAlignment(Qt.AlignCenter)
        self._label.setMinimumWidth(46)
        self._minus.clicked.connect(lambda: self.set_value(self._value - 1))
        self._plus.clicked.connect(lambda: self.set_value(self._value + 1))
        lay.addWidget(self._minus)
        lay.addWidget(self._label)
        lay.addWidget(self._plus)
        self._render()

    def value(self) -> int:
        return self._value

    def set_value(self, value: int) -> None:
        value = max(self._min, min(self._max, value))
        if value == self._value:
            return
        self._value = value
        self._render()
        self.value_changed.emit(value)

    def _render(self) -> None:
        self._label.setText(f"{self._value}{self._suffix}")
        self._minus.setEnabled(self._value > self._min)
        self._plus.setEnabled(self._value < self._max)


class DotRadio(QRadioButton):
    """웹의 라디오 버튼처럼: 가는 테두리 원, 선택되면 가운데에 검정 점. 글씨는 오른쪽에 그린다."""

    def __init__(self, text: str, parent: QWidget | None = None) -> None:
        super().__init__(text, parent)
        self.setCursor(Qt.PointingHandCursor)

    def sizeHint(self) -> QSize:  # noqa: N802
        fm = self.fontMetrics()
        return QSize(14 + 6 + fm.horizontalAdvance(self.text()) + 2, max(18, fm.height() + 2))

    def paintEvent(self, _event) -> None:  # noqa: N802
        p = QPainter(self)
        p.setRenderHint(QPainter.Antialiasing)
        cy = self.height() / 2
        circle = QRectF(1, cy - 7, 14, 14)
        p.setPen(QPen(QColor("#171717" if self.isChecked() else "#A3A3A3"), 1))
        p.setBrush(QColor("white"))
        p.drawEllipse(circle)
        if self.isChecked():
            p.setPen(Qt.NoPen)
            p.setBrush(QColor("#171717"))
            p.drawEllipse(QRectF(4.5, cy - 3.5, 7, 7))
        p.setPen(QColor(theme.TEXT))
        font = QFont(self.font())
        font.setPixelSize(12)
        p.setFont(font)
        p.drawText(QRectF(22, 0, self.width() - 22, self.height()), Qt.AlignVCenter | Qt.AlignLeft, self.text())
