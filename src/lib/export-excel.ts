import ExcelJS from "exceljs";
import type { ExportBundle } from "@/lib/export-data";

type Cell = string | number;
type RowKind = "title" | "header" | "data";
type StyledRow = { cells: Cell[]; kind: RowKind; color?: string };

const row = (cells: Cell[], kind: RowKind = "data", color?: string): StyledRow => ({
  cells,
  kind,
  color,
});

// 섹션마다 다른 색을 줘서 한눈에 구분되도록 한다 (fill / 글자색 쌍).
const PALETTE = {
  rose: { fill: "FFF7D9D9", font: "FF8A3D3D" },
  blue: { fill: "FFDCE6F7", font: "FF34507A" },
  green: { fill: "FFDFF3E4", font: "FF2E6B45" },
  amber: { fill: "FFFBEFD0", font: "FF8A6A1F" },
  purple: { fill: "FFE9E1F7", font: "FF5B3F8A" },
  teal: { fill: "FFD9F0EE", font: "FF1F6E67" },
  sky: { fill: "FFD9EEF7", font: "FF2A6E8A" },
} as const;

function buildWorkRows(bundle: ExportBundle): StyledRow[] {
  const months = bundle.monthlyChars.map((m) => m.month);
  const rows: StyledRow[] = [];

  rows.push(row(["월별 글자수 기록"], "title"));
  rows.push(row(["월", ...months], "header", "rose"));
  rows.push(row(["글자수", ...bundle.monthlyChars.map((m) => m.chars)]));
  rows.push(row([]));

  rows.push(row(["월별 뽀모도로 통계"], "title"));
  rows.push(row(["월", ...months], "header", "blue"));
  rows.push(row(["집중 시간(분)", ...bundle.monthlyPomodoro.map((m) => m.focusMinutes)]));
  rows.push(row(["뽀모도로 시작 횟수", ...bundle.monthlyPomodoro.map((m) => m.sessionCount)]));
  rows.push(row([]));

  rows.push(row(["작품별 글자수 기록 (작품 목록 = 행)"], "title"));
  const allDates = Array.from(new Set(bundle.workDailyChars.map((r) => r.date))).sort();
  if (bundle.works.length === 0) {
    rows.push(row(["등록된 작품이 없습니다"]));
  } else {
    rows.push(row(["작품명", ...allDates], "header", "green"));
    for (const work of bundle.works) {
      const byDate = new Map(
        bundle.workDailyChars.filter((r) => r.workId === work.id).map((r) => [r.date, r.chars])
      );
      rows.push(row([work.title, ...allDates.map((d) => byDate.get(d) ?? "")]));
    }
  }

  return rows;
}

function buildTaskLeftRows(bundle: ExportBundle): StyledRow[] {
  const rows: StyledRow[] = [];
  rows.push(row(["할일 목록"], "title"));
  rows.push(row(["할일 날짜", "할일명", "상태"], "header", "sky"));
  if (bundle.todos.length === 0) {
    rows.push(row(["표시할 할일이 없습니다", "", ""]));
  } else {
    for (const t of bundle.todos) rows.push(row([t.date, t.content, "미완료"]));
  }
  return rows;
}

function buildTaskRightRows(bundle: ExportBundle): StyledRow[] {
  const rows: StyledRow[] = [];

  rows.push(row(["목표 현황"], "title"));
  rows.push(row(["기간", "목표 글자수", "진행 글자수", "목표 시간(분)", "진행 시간(분)"], "header", "amber"));
  for (const g of bundle.goals) {
    rows.push(row([g.label, g.targetChars, g.progressChars, g.targetMinutes, g.progressMinutes]));
  }
  rows.push(row([]));

  rows.push(row([`랭킹 정보 (${bundle.ranking.thisMonth} 기준)`], "title"));
  rows.push(row(["구분", "순위", "전체/참고"], "header", "purple"));
  if (bundle.ranking.rooms.length === 0) {
    rows.push(row(["참여 중인 방 없음", "", ""]));
  } else {
    for (const r of bundle.ranking.rooms) rows.push(row([`방: ${r.name}`, r.rank, r.memberCount]));
  }
  rows.push(row(["전체 글자수 랭킹", bundle.ranking.overallRank, bundle.ranking.totalUsers]));
  rows.push(
    row([
      "대결 승패 랭킹",
      bundle.ranking.duelRank ?? "기록 없음",
      bundle.ranking.duelRank ? bundle.ranking.duelTotal : "",
    ])
  );
  rows.push(row(["챌린지 점수(참고용, 전체 순위는 비공개 정보라 제외)", bundle.ranking.challengeScore, ""]));
  rows.push(row([]));

  rows.push(row(["대결 현황"], "title"));
  rows.push(row(["제목", "지표", "시작일", "종료일", "상태", "내 기록", "상대 최고 기록"], "header", "rose"));
  if (bundle.duels.length === 0) {
    rows.push(row(["참여 중인 대결이 없습니다", "", "", "", "", "", ""]));
  } else {
    for (const d of bundle.duels) {
      rows.push(
        row([
          d.title,
          d.metric === "chars" ? "글자수" : "작업시간",
          d.start,
          d.end,
          d.status,
          d.myValue,
          d.bestOpponentValue,
        ])
      );
    }
  }
  rows.push(row([]));

  rows.push(row(["챌린지 기록"], "title"));
  rows.push(row(["챌린지", "참여 여부", "성공 횟수"], "header", "teal"));
  for (const c of bundle.systemChallenges) {
    rows.push(row([c.title, c.joined ? "참여 중" : "미참여", c.successCount]));
  }

  return rows;
}

function applyRowStyle(sheetRow: ExcelJS.Row, colStart: number, colCount: number, kind: RowKind, color?: string) {
  if (kind === "data" || colCount === 0) return;
  for (let i = 0; i < colCount; i++) {
    const cell = sheetRow.getCell(colStart + i);
    if (kind === "title") {
      cell.font = { bold: true, size: 12 };
    } else if (kind === "header") {
      const palette = color ? PALETTE[color as keyof typeof PALETTE] : undefined;
      cell.font = { bold: true, color: { argb: palette?.font ?? "FF262626" } };
      if (palette) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.fill } };
    }
  }
}

function fillWorkSheet(sheet: ExcelJS.Worksheet, bundle: ExportBundle) {
  const rows = buildWorkRows(bundle);
  sheet.addRows(rows.map((r) => r.cells));
  rows.forEach((r, i) => {
    const excelRow = sheet.getRow(i + 1);
    applyRowStyle(excelRow, 1, Math.max(r.cells.length, 1), r.kind, r.color);
  });
  const maxCols = Math.max(...rows.map((r) => r.cells.length), 1);
  sheet.getColumn(1).width = 22;
  for (let i = 2; i <= maxCols; i++) sheet.getColumn(i).width = 11;
}

function fillTaskSheet(sheet: ExcelJS.Worksheet, bundle: ExportBundle) {
  const left = buildTaskLeftRows(bundle);
  const right = buildTaskRightRows(bundle);
  const rowCount = Math.max(left.length, right.length);
  const gutterCol = 4; // A-C: 할일, D: 빈 칸, E~: 오른쪽 블록

  const merged: Cell[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const l = left[i]?.cells ?? [];
    const r = right[i]?.cells ?? [];
    const lPadded = [l[0] ?? "", l[1] ?? "", l[2] ?? ""];
    merged.push([...lPadded, "", ...r]);
  }
  sheet.addRows(merged);

  for (let i = 0; i < rowCount; i++) {
    const excelRow = sheet.getRow(i + 1);
    const l = left[i];
    if (l) applyRowStyle(excelRow, 1, 3, l.kind, l.color);
    const r = right[i];
    if (r) applyRowStyle(excelRow, gutterCol + 1, r.cells.length, r.kind, r.color);
  }

  const widths = [12, 26, 8, 2, 34, 12, 12, 12];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
}

export async function buildExportWorkbook(bundle: ExportBundle): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "PoRoom";
  wb.created = new Date();

  fillWorkSheet(wb.addWorksheet("WORK"), bundle);
  fillTaskSheet(wb.addWorksheet("TASK"), bundle);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
