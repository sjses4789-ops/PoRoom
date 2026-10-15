"""[포룸] 맨 위 "내 현황" — 할 일 · 출석 달력 · 오늘의 글자수/이번 달 목표/랭킹. 웹의 main-dashboard.tsx와 같은 구성·치수."""
from __future__ import annotations

import calendar

from PySide6.QtCore import QRectF, Qt
from PySide6.QtGui import QColor, QPainter
from PySide6.QtWidgets import (
    QCheckBox,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from ..models import Dashboard, Todo
from ..repo import RepositoryProtocol
from .dialogs import TodoHistoryDialog
from .scale import N50, N100, N300, N400, N500, N600, N700, N900, RADIUS, fs, sp
from .widgets import run_async

WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
FLAT = "border: none; background: transparent;"


class GoalBar(QWidget):
    """이번 달 목표 진행 막대(웹의 GoalBar) — 위에 "글자수 / 12,000 / 60,000자 (20%)", 아래에 h-2 둥근 막대."""

    def __init__(self, label: str, current: int, target: int, unit: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._pct = min(100, round(current / target * 100)) if target > 0 else 0
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(sp(1.5))
        row = QHBoxLayout()
        left = QLabel(label)
        left.setStyleSheet(f"color: {N500}; {fs('xs')}")
        right = QLabel(f"{current:,} / {target:,}{unit} ({self._pct}%)")
        right.setStyleSheet(f"color: {N500}; {fs('xs')}")
        row.addWidget(left)
        row.addStretch(1)
        row.addWidget(right)
        lay.addLayout(row)
        self._bar = QWidget()
        self._bar.setFixedHeight(sp(2))
        self._bar.paintEvent = self._paint_bar  # type: ignore[method-assign]
        lay.addWidget(self._bar)

    def _paint_bar(self, _event) -> None:
        p = QPainter(self._bar)
        p.setRenderHint(QPainter.Antialiasing)
        w, h = self._bar.width(), self._bar.height()
        p.setPen(Qt.NoPen)
        p.setBrush(QColor(N100))
        p.drawRoundedRect(QRectF(0, 0, w, h), h / 2, h / 2)
        if self._pct > 0:
            p.setBrush(QColor(N900))
            p.drawRoundedRect(QRectF(0, 0, w * self._pct / 100, h), h / 2, h / 2)


class AttendanceCalendar(QWidget):
    """이번 달 출석 달력 — max-w 220, 출석한 날은 초록(emerald-500), 아래에 "이번 달 출석 N일"과 연속 출석."""

    CELL = 30  # (220 - 6칸 사이 간격 2px*6) / 7 ≈ 29.7

    def __init__(self, year: int, month: int, attended: set[str], streak: int, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setMaximumWidth(220)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(sp(1.5))
        grid = QGridLayout()
        grid.setSpacing(2)
        for i, name in enumerate(WEEKDAYS):
            label = QLabel(name)
            label.setAlignment(Qt.AlignCenter)
            label.setFixedSize(self.CELL, 14)
            label.setStyleSheet(f"color: {N400}; {fs(10)}")
            grid.addWidget(label, 0, i)

        days_in_month = calendar.monthrange(year, month)[1]
        # 파이썬은 월요일=0 — 웹(Date#getDay)처럼 일요일=0으로 바꾼다.
        start_weekday = (calendar.monthrange(year, month)[0] + 1) % 7
        attended_count = 0
        for day in range(1, days_in_month + 1):
            idx = start_weekday + day - 1
            key = f"{year}-{month:02d}-{day:02d}"
            on = key in attended
            attended_count += 1 if on else 0
            cell = QLabel(str(day))
            cell.setAlignment(Qt.AlignCenter)
            cell.setFixedSize(self.CELL, self.CELL)
            cell.setStyleSheet(
                f"background: #10B981; color: white; border-radius: 4px; {fs(11)}"
                if on
                else f"background: {N100}; color: {N500}; border-radius: 4px; {fs(11)}"
            )
            grid.addWidget(cell, 1 + idx // 7, idx % 7)
        lay.addLayout(grid)

        count = QLabel(f"이번 달 출석 {attended_count}일")
        count.setAlignment(Qt.AlignCenter)
        count.setStyleSheet(f"{fs('sm')} color: {N600};")
        lay.addWidget(count)
        fire = QLabel(f"🔥 연속 출석 {streak}일")
        fire.setAlignment(Qt.AlignCenter)
        fire.setStyleSheet(f"{fs('xs')} color: #D97706;")
        lay.addWidget(fire)


class TodoList(QWidget):
    """오늘의 할 일 — 추가/체크(완료)/수정(글을 눌러서)/삭제, "+ 더보기"로 날짜별 기록."""

    def __init__(self, repo: RepositoryProtocol, todos: list[Todo], parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._repo = repo
        self._todos = list(todos)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(sp(2))

        add_row = QHBoxLayout()
        add_row.setSpacing(sp(1.5))
        self._input = QLineEdit()
        self._input.setPlaceholderText("할 일 추가")
        self._input.returnPressed.connect(self._add)
        add_btn = QPushButton("+")
        add_btn.setObjectName("dark")
        add_btn.setCursor(Qt.PointingHandCursor)
        add_btn.clicked.connect(self._add)
        add_row.addWidget(self._input, 1)
        add_row.addWidget(add_btn)
        lay.addLayout(add_row)

        self._list = QVBoxLayout()
        self._list.setSpacing(sp(1))
        lay.addLayout(self._list)

        more = QPushButton("+ 더보기")
        more.setFlat(True)
        more.setCursor(Qt.PointingHandCursor)
        more.setStyleSheet(f"{FLAT} color: {N400}; {fs(11)} text-align: left; padding: 0;")
        more.clicked.connect(self._open_history)
        lay.addWidget(more, 0, Qt.AlignLeft)
        lay.addStretch(1)
        self._render()

    # ── 화면 ───────────────────────────────────────────────────
    def _render(self) -> None:
        while self._list.count():
            item = self._list.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        if not self._todos:
            empty = QLabel("할 일이 없습니다.")
            empty.setStyleSheet(f"color: {N400}; {fs(12)}")
            self._list.addWidget(empty)
            return
        for todo in self._todos:
            self._list.addWidget(self._row(todo))

    def _row(self, todo: Todo) -> QWidget:
        host = QWidget()
        row = QHBoxLayout(host)
        row.setContentsMargins(0, 0, 0, 0)
        row.setSpacing(sp(2))
        check = QCheckBox()
        check.setStyleSheet(
            "QCheckBox::indicator { width: 13px; height: 13px; border: 1px solid #A3A3A3; border-radius: 2px; background: white; }"
            "QCheckBox::indicator:checked { background: #171717; border-color: #171717; }"
        )
        check.stateChanged.connect(lambda _s, t=todo: self._complete(t))
        text = QPushButton(todo.content)
        text.setFlat(True)
        text.setCursor(Qt.IBeamCursor)
        text.setStyleSheet(f"{FLAT} text-align: left; {fs('xs')} color: {N700}; padding: 2px 0;")
        text.clicked.connect(lambda _c=False, t=todo, h=host, tx=text: self._edit(t, h, tx))
        remove = QPushButton("✕")
        remove.setFlat(True)
        remove.setCursor(Qt.PointingHandCursor)
        remove.setStyleSheet(f"{FLAT} color: {N300}; padding: 0 2px; {fs('xs')}")
        remove.clicked.connect(lambda _c=False, t=todo: self._remove(t))
        row.addWidget(check)
        row.addWidget(text, 1)
        row.addWidget(remove)
        return host

    # ── 동작 ───────────────────────────────────────────────────
    def _add(self) -> None:
        content = self._input.text().strip()
        if not content:
            return
        self._input.clear()

        def done(result: object, err: Exception | None) -> None:
            if isinstance(result, Todo) and err is None:
                self._todos.append(result)
                self._render()

        run_async(self, lambda: self._repo.create_todo(content), done)

    def _complete(self, todo: Todo) -> None:
        # 체크하면 목록에서는 사라지지만 삭제가 아니라 완료 처리라 "+ 더보기" 기록에는 남는다(웹과 같다).
        self._todos = [t for t in self._todos if t.id != todo.id]
        self._render()
        run_async(self, lambda: self._repo.complete_todo(todo.id), lambda *_: None)

    def _remove(self, todo: Todo) -> None:
        self._todos = [t for t in self._todos if t.id != todo.id]
        self._render()
        run_async(self, lambda: self._repo.delete_todo(todo.id), lambda *_: None)

    def _edit(self, todo: Todo, host: QWidget, text_button: QPushButton) -> None:
        editor = QLineEdit(todo.content)
        host.layout().replaceWidget(text_button, editor)
        text_button.hide()
        editor.setFocus()
        editor.selectAll()

        def save() -> None:
            content = editor.text().strip()
            if content and content != todo.content:
                todo.content = content
                run_async(self, lambda: self._repo.update_todo(todo.id, content), lambda *_: None)
            self._render()

        editor.editingFinished.connect(save)

    def _open_history(self) -> None:
        TodoHistoryDialog(self, self._repo).exec_over()


class StatsPanel(QWidget):
    """오늘의 글자수 · 이번 달 목표 · 이번 달 랭킹."""

    def __init__(self, data: Dashboard, is_webtoon: bool, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(sp(3))

        today = QFrame()
        today.setStyleSheet(f"QFrame {{ background: {N50}; border: none; border-radius: {RADIUS['md']}px; }}")
        tl = QVBoxLayout(today)
        tl.setContentsMargins(0, sp(3), 0, sp(3))
        tl.setSpacing(sp(1))
        number = QLabel(f"{data.today_chars:,}")
        number.setAlignment(Qt.AlignCenter)
        number.setStyleSheet(f"{fs('2xl')} font-weight: 700; background: transparent;")
        caption = QLabel("오늘의 작업량" if is_webtoon else "오늘의 글자수")
        caption.setAlignment(Qt.AlignCenter)
        caption.setStyleSheet(f"color: {N500}; {fs(12)} background: transparent;")
        tl.addWidget(number)
        tl.addWidget(caption)
        lay.addWidget(today)

        goal = QVBoxLayout()
        goal.setSpacing(sp(2))
        goal_title = QLabel("이번 달 목표 작업량" if is_webtoon else "이번 달 목표 글자수")
        goal_title.setStyleSheet(f"color: {N500}; {fs(12)}")
        goal.addWidget(goal_title)
        if data.month_goal_chars > 0:
            goal.addWidget(
                GoalBar("작업량" if is_webtoon else "글자수", data.month_progress_chars, data.month_goal_chars, "컷" if is_webtoon else "자")
            )
        else:
            hint = QLabel("[개인] 페이지에서 이번 달 목표를 설정해보세요.")
            hint.setWordWrap(True)
            hint.setStyleSheet(f"color: {N400}; {fs(12)}")
            goal.addWidget(hint)
        lay.addLayout(goal)

        rank = QFrame()
        rank.setStyleSheet(f"QFrame {{ background: {N50}; border: none; border-radius: {RADIUS['xl']}px; }}")
        rl = QVBoxLayout(rank)
        rl.setContentsMargins(sp(3), sp(2.5), sp(3), sp(2.5))
        rl.setSpacing(sp(1))
        title = QLabel("웹툰 작가 랭킹 (이번 달)" if is_webtoon else "개인 랭킹 (이번 달)")
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet(f"color: {N500}; {fs(12)} background: transparent;")
        line = QLabel(f"전체 {data.overall_rank}위 / {data.total_users}명")
        line.setAlignment(Qt.AlignCenter)
        line.setStyleSheet(f"{fs('sm')} font-weight: 700; background: transparent;")
        rl.addWidget(title)
        rl.addWidget(line)
        if data.total_users > 0:
            percent = max(1, round(data.overall_rank / data.total_users * 100))
            pct = QLabel(f"(상위 {percent}%)")
            pct.setAlignment(Qt.AlignCenter)
            pct.setStyleSheet(f"color: {N400}; {fs(12)} background: transparent;")
            rl.addWidget(pct)
        lay.addWidget(rank)
        lay.addStretch(1)


class DashboardPanel(QFrame):
    """rounded-lg border border-neutral-200 p-4 · gap-4 — 안에 제목 + 3칸(sm:grid-cols-3)."""

    def __init__(self, repo: RepositoryProtocol, data: Dashboard, position: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("card")
        lay = QVBoxLayout(self)
        lay.setContentsMargins(sp(4), sp(4), sp(4), sp(4))
        lay.setSpacing(sp(4))
        title = QLabel("내 현황")
        title.setStyleSheet(f"{fs('sm')} font-weight: 700; border: none; background: transparent;")
        lay.addWidget(title)
        row = QHBoxLayout()
        row.setSpacing(sp(4))
        row.addWidget(TodoList(repo, data.todos), 1)
        calendar_host = QWidget()
        cal_lay = QVBoxLayout(calendar_host)
        cal_lay.setContentsMargins(0, 0, 0, 0)
        cal_lay.addWidget(AttendanceCalendar(data.year, data.month, data.attended_dates, data.streak_days), 0, Qt.AlignHCenter | Qt.AlignTop)
        row.addWidget(calendar_host, 1)
        row.addWidget(StatsPanel(data, position == "webtoon"), 1)
        lay.addLayout(row)


__all__ = ["DashboardPanel"]
