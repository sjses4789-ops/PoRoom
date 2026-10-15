"""웹의 가운데 팝업(어두운 막 + 흰 상자 + 그림자)과 같은 모양의 대화상자."""
from __future__ import annotations

from PySide6.QtCore import QPoint, Qt
from PySide6.QtGui import QColor
from PySide6.QtWidgets import QDialog, QFrame, QGraphicsDropShadowEffect, QVBoxLayout, QWidget


class Popup(QDialog):
    """흰 상자 팝업 — exec_over()로 열면 부모 창 위에 어두운 막이 깔리고 팝업이 가운데에 뜬다."""

    def __init__(self, parent: QWidget | None, width: int = 340, padding: int = 17, gap: int = 13) -> None:
        super().__init__(parent.window() if parent is not None else None)
        self.setWindowFlags(Qt.Dialog | Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setModal(True)
        self._width = width

        outer = QVBoxLayout(self)
        outer.setContentsMargins(14, 14, 14, 14)  # 그림자가 그려질 여백
        self.box = QFrame()
        self.box.setObjectName("popupbox")
        self.box.setStyleSheet(
            "QFrame#popupbox { background: white; border: 1px solid #D4D4D4; border-radius: 3px; }"
        )
        shadow = QGraphicsDropShadowEffect(self.box)
        shadow.setBlurRadius(28)
        shadow.setOffset(0, 6)
        shadow.setColor(QColor(0, 0, 0, 60))
        self.box.setGraphicsEffect(shadow)
        outer.addWidget(self.box)
        self.body = QVBoxLayout(self.box)
        self.body.setContentsMargins(padding, padding, padding, padding)
        self.body.setSpacing(gap)
        self.setFixedWidth(width + 28)

    def exec_over(self) -> int:
        parent = self.parentWidget()
        overlay: QWidget | None = None
        if parent is not None:
            overlay = QWidget(parent)
            overlay.setStyleSheet("background: rgba(23, 23, 23, 0.28);")
            overlay.setGeometry(parent.rect())
            overlay.show()
            overlay.raise_()
        self.layout().activate()
        self.adjustSize()
        if parent is not None:
            center = parent.mapToGlobal(parent.rect().center())
            self.move(center - QPoint(self.width() // 2, self.height() // 2))
        try:
            return self.exec()
        finally:
            if overlay is not None:
                overlay.deleteLater()

    def keyPressEvent(self, event) -> None:  # noqa: N802
        if event.key() == Qt.Key_Escape:
            self.reject()
            return
        super().keyPressEvent(event)
