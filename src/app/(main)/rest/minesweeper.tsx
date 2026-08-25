"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const ROWS = 9;
const COLS = 9;
const MINES = 10;

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

type Status = "ready" | "playing" | "won" | "lost";

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
}

function neighbors(r: number, c: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push([nr, nc]);
    }
  }
  return out;
}

// 첫 클릭에서 바로 지뢰가 터지지 않도록, 첫 클릭 이후에 그 칸(과 주변)을
// 피해서 지뢰를 심는다.
function seedMines(board: Cell[][], avoidR: number, avoidC: number) {
  const avoid = new Set(neighbors(avoidR, avoidC).map(([r, c]) => `${r},${c}`));
  avoid.add(`${avoidR},${avoidC}`);
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (board[r][c].mine || avoid.has(`${r},${c}`)) continue;
    board[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue;
      board[r][c].adjacent = neighbors(r, c).filter(([nr, nc]) => board[nr][nc].mine).length;
    }
  }
}

function floodReveal(board: Cell[][], r: number, c: number) {
  const cell = board[r][c];
  if (cell.revealed || cell.flagged) return;
  cell.revealed = true;
  if (cell.adjacent === 0 && !cell.mine) {
    for (const [nr, nc] of neighbors(r, c)) floodReveal(board, nr, nc);
  }
}

export function Minesweeper() {
  const t = useTranslations("rest.minesweeper");
  const [board, setBoard] = useState<Cell[][]>(emptyBoard);
  const [status, setStatus] = useState<Status>("ready");
  const [flagMode, setFlagMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      if (startRef.current !== null) setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setStatus("ready");
    setFlagMode(false);
    setElapsed(0);
    startRef.current = null;
  }, []);

  const checkWin = (b: Cell[][]) =>
    b.every((row) => row.every((cell) => cell.mine || cell.revealed));

  const revealAllMines = (b: Cell[][]) => {
    for (const row of b) for (const cell of row) if (cell.mine) cell.revealed = true;
  };

  const openCell = useCallback(
    (r: number, c: number) => {
      if (status === "won" || status === "lost") return;
      const cell = board[r][c];
      if (cell.revealed) return;

      if (flagMode) {
        if (cell.revealed) return;
        const next = board.map((row) => row.map((cl) => ({ ...cl })));
        next[r][c].flagged = !next[r][c].flagged;
        setBoard(next);
        return;
      }
      if (cell.flagged) return;

      const next = board.map((row) => row.map((cl) => ({ ...cl })));
      if (status === "ready") {
        seedMines(next, r, c);
        startRef.current = Date.now();
        setStatus("playing");
      }

      if (next[r][c].mine) {
        revealAllMines(next);
        next[r][c].revealed = true;
        setBoard(next);
        setStatus("lost");
        return;
      }

      floodReveal(next, r, c);
      setBoard(next);
      if (checkWin(next)) setStatus("won");
    },
    [board, status, flagMode]
  );

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    const cell = board[r][c];
    if (cell.revealed || status === "won" || status === "lost") return;
    const next = board.map((row) => row.map((cl) => ({ ...cl })));
    next[r][c].flagged = !next[r][c].flagged;
    setBoard(next);
  };

  const flagCount = board.reduce((sum, row) => sum + row.filter((c) => c.flagged).length, 0);
  const NUMBER_COLOR: Record<number, string> = {
    1: "text-blue-600",
    2: "text-emerald-600",
    3: "text-red-600",
    4: "text-indigo-700",
    5: "text-amber-700",
    6: "text-teal-600",
    7: "text-neutral-900",
    8: "text-neutral-500",
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{t("hint")}</span>
      </div>

      <div className="rounded-sm border border-neutral-400 p-5 dark:border-neutral-600">
        <div className="mb-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">
            {t("mineCount", { count: Math.max(MINES - flagCount, 0) })}
          </span>
          <span className="font-medium text-neutral-600 dark:text-neutral-300">
            {t("timeLabel", { seconds: elapsed })}
          </span>
          <button
            type="button"
            onClick={() => setFlagMode((v) => !v)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              flagMode
                ? "border-amber-400 bg-amber-400 text-white"
                : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            🚩 {t("flagMode")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {t("reset")}
          </button>
        </div>

        {status === "won" && (
          <p className="mb-3 text-center text-sm font-semibold text-emerald-600">{t("won")}</p>
        )}
        {status === "lost" && (
          <p className="mb-3 text-center text-sm font-semibold text-red-600">{t("lost")}</p>
        )}

        <div
          className="mx-auto grid w-fit select-none gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${COLS}, 28px)` }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => openCell(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                disabled={status === "won" || status === "lost"}
                className={`flex h-7 w-7 items-center justify-center rounded-sm text-xs font-bold transition ${
                  cell.revealed
                    ? cell.mine
                      ? "bg-red-200 dark:bg-red-900"
                      : "bg-neutral-100 dark:bg-neutral-800"
                    : "bg-neutral-300 hover:bg-neutral-200 dark:bg-neutral-600 dark:hover:bg-neutral-500"
                }`}
              >
                {cell.revealed
                  ? cell.mine
                    ? "💣"
                    : cell.adjacent > 0
                      ? <span className={NUMBER_COLOR[cell.adjacent]}>{cell.adjacent}</span>
                      : ""
                  : cell.flagged
                    ? "🚩"
                    : ""}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
