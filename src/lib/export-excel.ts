import ExcelJS from "exceljs";
import type { ExportBundle } from "@/lib/export-data";

type Cell = string | number;

function buildWorkRows(bundle: ExportBundle): Cell[][] {
  const months = bundle.monthlyChars.map((m) => m.month);
  const rows: Cell[][] = [];

  rows.push(["월별 글자수 기록"]);
  rows.push(["월", ...months]);
  rows.push(["글자수", ...bundle.monthlyChars.map((m) => m.chars)]);
  rows.push([]);

  rows.push(["월별 뽀모도로 통계"]);
  rows.push(["월", ...months]);
  rows.push(["집중 시간(분)", ...bundle.monthlyPomodoro.map((m) => m.focusMinutes)]);
  rows.push(["뽀모도로 시작 횟수", ...bundle.monthlyPomodoro.map((m) => m.sessionCount)]);
  rows.push([]);

  rows.push(["작품별 글자수 기록 (작품 목록 = 행)"]);
  const allDates = Array.from(new Set(bundle.workDailyChars.map((r) => r.date))).sort();
  if (bundle.works.length === 0) {
    rows.push(["등록된 작품이 없습니다"]);
  } else {
    rows.push(["작품명", ...allDates]);
    for (const work of bundle.works) {
      const byDate = new Map(
        bundle.workDailyChars.filter((r) => r.workId === work.id).map((r) => [r.date, r.chars])
      );
      rows.push([work.title, ...allDates.map((d) => byDate.get(d) ?? "")]);
    }
  }

  return rows;
}

function buildTaskRows(bundle: ExportBundle): Cell[][] {
  const left: Cell[][] = [];
  left.push(["할일 목록"]);
  left.push(["할일 날짜", "할일명", "상태"]);
  if (bundle.todos.length === 0) {
    left.push(["표시할 할일이 없습니다", "", ""]);
  } else {
    for (const t of bundle.todos) left.push([t.date, t.content, "미완료"]);
  }

  const right: Cell[][] = [];
  right.push(["목표 현황"]);
  right.push(["기간", "목표 글자수", "진행 글자수", "목표 시간(분)", "진행 시간(분)"]);
  for (const g of bundle.goals) {
    right.push([g.label, g.targetChars, g.progressChars, g.targetMinutes, g.progressMinutes]);
  }
  right.push([]);

  right.push([`랭킹 정보 (${bundle.ranking.thisMonth} 기준)`]);
  right.push(["구분", "순위", "전체/참고"]);
  if (bundle.ranking.rooms.length === 0) {
    right.push(["참여 중인 방 없음", "", ""]);
  } else {
    for (const r of bundle.ranking.rooms) right.push([`방: ${r.name}`, r.rank, r.memberCount]);
  }
  right.push(["전체 글자수 랭킹", bundle.ranking.overallRank, bundle.ranking.totalUsers]);
  right.push([
    "대결 승패 랭킹",
    bundle.ranking.duelRank ?? "기록 없음",
    bundle.ranking.duelRank ? bundle.ranking.duelTotal : "",
  ]);
  right.push(["챌린지 점수(참고용, 전체 순위는 비공개 정보라 제외)", bundle.ranking.challengeScore, ""]);
  right.push([]);

  right.push(["대결 현황"]);
  right.push(["제목", "지표", "시작일", "종료일", "상태", "내 기록", "상대 최고 기록"]);
  if (bundle.duels.length === 0) {
    right.push(["참여 중인 대결이 없습니다", "", "", "", "", "", ""]);
  } else {
    for (const d of bundle.duels) {
      right.push([
        d.title,
        d.metric === "chars" ? "글자수" : "작업시간",
        d.start,
        d.end,
        d.status,
        d.myValue,
        d.bestOpponentValue,
      ]);
    }
  }
  right.push([]);

  right.push(["챌린지 기록"]);
  right.push(["챌린지", "참여 여부", "성공 횟수"]);
  for (const c of bundle.systemChallenges) {
    right.push([c.title, c.joined ? "참여 중" : "미참여", c.successCount]);
  }

  const rowCount = Math.max(left.length, right.length);
  const merged: Cell[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const l = left[i] ?? [];
    const r = right[i] ?? [];
    const lPadded = [l[0] ?? "", l[1] ?? "", l[2] ?? ""];
    merged.push([...lPadded, "", ...r]);
  }
  return merged;
}

function fillSheet(sheet: ExcelJS.Worksheet, rows: Cell[][], colWidths: number[]) {
  sheet.addRows(rows);
  colWidths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
  for (const row of sheet.getRows(1, sheet.rowCount) ?? []) {
    const first = row.getCell(1);
    if (typeof first.value === "string" && first.value && !row.getCell(2).value) {
      first.font = { bold: true };
    }
  }
}

export async function buildExportWorkbook(bundle: ExportBundle): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "PoRoom";
  wb.created = new Date();

  const workRows = buildWorkRows(bundle);
  const workDateCount = Math.max(0, ...workRows.map((r) => r.length)) - 1;
  fillSheet(wb.addWorksheet("WORK"), workRows, [22, ...Array(Math.max(workDateCount, 1)).fill(11)]);

  const taskRows = buildTaskRows(bundle);
  fillSheet(wb.addWorksheet("TASK"), taskRows, [12, 26, 8, 2, 34, 12, 12, 12]);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
