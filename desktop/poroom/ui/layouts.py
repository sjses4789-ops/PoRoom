"""줄바꿈 배치(칩), 세로로 빈틈 없이 쌓는 다단 배치(방 카드) — 웹의 flex-wrap / CSS columns와 같은 모양."""
from __future__ import annotations

from PySide6.QtCore import QRect, QSize, Qt
from PySide6.QtWidgets import QHBoxLayout, QLayout, QLayoutItem, QSizePolicy, QVBoxLayout, QWidget


class FlowLayout(QLayout):
    """위젯을 왼쪽에서 오른쪽으로 놓다가 넘치면 다음 줄로 넘기는 배치(태그 칩용)."""

    def __init__(self, parent: QWidget | None = None, h_spacing: int = 6, v_spacing: int = 6) -> None:
        super().__init__(parent)
        self._items: list[QLayoutItem] = []
        self._h = h_spacing
        self._v = v_spacing
        self.setContentsMargins(0, 0, 0, 0)

    def addItem(self, item: QLayoutItem) -> None:  # noqa: N802
        self._items.append(item)

    def count(self) -> int:
        return len(self._items)

    def itemAt(self, index: int) -> QLayoutItem | None:  # noqa: N802
        return self._items[index] if 0 <= index < len(self._items) else None

    def takeAt(self, index: int) -> QLayoutItem | None:  # noqa: N802
        return self._items.pop(index) if 0 <= index < len(self._items) else None

    def expandingDirections(self) -> Qt.Orientations:  # noqa: N802
        return Qt.Orientations()

    def hasHeightForWidth(self) -> bool:  # noqa: N802
        return True

    def heightForWidth(self, width: int) -> int:  # noqa: N802
        return self._do_layout(QRect(0, 0, width, 0), test_only=True)

    def setGeometry(self, rect: QRect) -> None:  # noqa: N802
        super().setGeometry(rect)
        self._do_layout(rect, test_only=False)

    def sizeHint(self) -> QSize:  # noqa: N802
        return self.minimumSize()

    def minimumSize(self) -> QSize:  # noqa: N802
        size = QSize()
        for item in self._items:
            size = size.expandedTo(item.minimumSize())
        margins = self.contentsMargins()
        return size + QSize(margins.left() + margins.right(), margins.top() + margins.bottom())

    def _do_layout(self, rect: QRect, test_only: bool) -> int:
        m = self.contentsMargins()
        effective = rect.adjusted(m.left(), m.top(), -m.right(), -m.bottom())
        x, y, line_height = effective.x(), effective.y(), 0
        for item in self._items:
            hint = item.sizeHint()
            next_x = x + hint.width() + self._h
            if next_x - self._h > effective.right() + 1 and line_height > 0:
                x = effective.x()
                y += line_height + self._v
                next_x = x + hint.width() + self._h
                line_height = 0
            if not test_only:
                item.setGeometry(QRect(x, y, hint.width(), hint.height()))
            x = next_x
            line_height = max(line_height, hint.height())
        return y + line_height - rect.y() + m.bottom()


class MasonryColumns(QWidget):
    """카드를 N개의 세로 칸에 높이가 가장 낮은 칸부터 채워 쌓는다(웹의 columns-1 sm:columns-2 lg:columns-3).

    카드 높이가 제각각이어도 같은 줄에 높이를 맞추느라 생기는 빈 여백이 없다.
    """

    def __init__(self, parent: QWidget | None = None, gap: int = 12) -> None:
        super().__init__(parent)
        self._gap = gap
        self._cards: list[QWidget] = []
        self._columns = 0
        self._cols: list[QVBoxLayout] = []
        self._row = QHBoxLayout(self)
        self._row.setContentsMargins(0, 0, 0, 0)
        self._row.setSpacing(gap)
        self._row.setAlignment(Qt.AlignTop)
        self.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Minimum)

    def set_cards(self, cards: list[QWidget]) -> None:
        # 이전 카드는 지우고 새로 놓는다.
        for card in self._cards:
            card.setParent(None)
            card.deleteLater()
        self._cards = cards
        self._rebuild(force=True)

    def _wanted_columns(self) -> int:
        width = self.width()
        if width >= 760:
            return 3
        if width >= 480:
            return 2
        return 1

    def resizeEvent(self, event) -> None:  # noqa: N802
        super().resizeEvent(event)
        self._rebuild(force=False)

    def _rebuild(self, force: bool) -> None:
        n = self._wanted_columns()
        if not force and n == self._columns and self._cols:
            return
        self._columns = n
        # 칸 레이아웃을 비운다(카드는 지우지 않는다).
        while self._row.count():
            item = self._row.takeAt(0)
            inner = item.layout()
            if inner is not None:
                while inner.count():
                    inner.takeAt(0)
                inner.deleteLater()
        self._cols = []
        heights = [0] * n
        for _ in range(n):
            col = QVBoxLayout()
            col.setSpacing(self._gap)
            col.setAlignment(Qt.AlignTop)
            col.setContentsMargins(0, 0, 0, 0)
            self._cols.append(col)
            self._row.addLayout(col, 1)
        for card in self._cards:
            idx = heights.index(min(heights))
            self._cols[idx].addWidget(card)
            card.show()
            heights[idx] += max(card.sizeHint().height(), 60) + self._gap
        for col in self._cols:
            col.addStretch(1)
