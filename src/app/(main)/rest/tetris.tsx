"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const COLS = 10;
const ROWS = 20;

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

const SHAPES: Record<PieceType, string[][]> = {
  I: [
    ["....", "####", "....", "...."],
    ["..#.", "..#.", "..#.", "..#."],
    ["....", "####", "....", "...."],
    ["..#.", "..#.", "..#.", "..#."],
  ],
  O: [
    ["....", ".##.", ".##.", "...."],
    ["....", ".##.", ".##.", "...."],
    ["....", ".##.", ".##.", "...."],
    ["....", ".##.", ".##.", "...."],
  ],
  T: [
    ["....", ".#..", "###.", "...."],
    ["....", ".#..", ".##.", ".#.."],
    ["....", "....", "###.", ".#.."],
    ["....", ".#..", "##..", ".#.."],
  ],
  S: [
    ["....", ".##.", "##..", "...."],
    ["....", ".#..", ".##.", "..#."],
    ["....", ".##.", "##..", "...."],
    ["....", ".#..", ".##.", "..#."],
  ],
  Z: [
    ["....", "##..", ".##.", "...."],
    ["....", "..#.", ".##.", ".#.."],
    ["....", "##..", ".##.", "...."],
    ["....", "..#.", ".##.", ".#.."],
  ],
  J: [
    ["....", "#...", "###.", "...."],
    ["....", ".##.", ".#..", ".#.."],
    ["....", "....", "###.", "..#."],
    ["....", ".#..", ".#..", "##.."],
  ],
  L: [
    ["....", "..#.", "###.", "...."],
    ["....", ".#..", ".#..", ".##."],
    ["....", "....", "###.", "#..."],
    ["....", "##..", ".#..", ".#.."],
  ],
};

const COLOR: Record<PieceType, string> = {
  I: "#5fd3f3",
  O: "#f3e05f",
  T: "#c17bd6",
  S: "#7bd68a",
  Z: "#e37b7b",
  J: "#7b93e3",
  L: "#e3a35f",
};

const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

function cellsOf(type: PieceType, rotation: number): [number, number][] {
  const grid = SHAPES[type][rotation % 4];
  const out: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === "#") out.push([r, c]);
    }
  }
  return out;
}

function randomType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

type Grid = (string | null)[][];

function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
}

type Piece = { type: PieceType; rotation: number; row: number; col: number };

function collides(grid: Grid, piece: Piece): boolean {
  for (const [dr, dc] of cellsOf(piece.type, piece.rotation)) {
    const r = piece.row + dr;
    const c = piece.col + dc;
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r >= 0 && grid[r][c]) return true;
  }
  return false;
}

const LINE_SCORE = [0, 100, 300, 500, 800];
const SPAWN_COL = 3;

type Status = "idle" | "playing" | "paused" | "over";

export function Tetris() {
  const t = useTranslations("rest.tetris");
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [nextType, setNextType] = useState<PieceType>(randomType);
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const level = Math.floor(lines / 10) + 1;
  const dropMs = Math.max(800 - (level - 1) * 60, 120);

  const gridRef = useRef(grid);
  const pieceRef = useRef(piece);
  const statusRef = useRef(status);
  useEffect(() => {
    gridRef.current = grid;
    pieceRef.current = piece;
    statusRef.current = status;
  }, [grid, piece, status]);

  const spawnPiece = useCallback((g: Grid, type: PieceType): Piece | null => {
    const p: Piece = { type, rotation: 0, row: -1, col: SPAWN_COL };
    if (collides(g, p)) return null;
    return p;
  }, []);

  const lockAndAdvance = useCallback(
    (g: Grid, p: Piece) => {
      const next = g.map((row) => [...row]);
      for (const [dr, dc] of cellsOf(p.type, p.rotation)) {
        const r = p.row + dr;
        const c = p.col + dc;
        if (r >= 0) next[r][c] = COLOR[p.type];
      }
      let cleared = 0;
      const survived = next.filter((row) => {
        const full = row.every((cell) => cell !== null);
        if (full) cleared++;
        return !full;
      });
      while (survived.length < ROWS) survived.unshift(Array<string | null>(COLS).fill(null));

      if (cleared > 0) {
        setScore((s) => s + LINE_SCORE[cleared] * level);
        setLines((l) => l + cleared);
      }
      setGrid(survived);

      const spawned = spawnPiece(survived, nextType);
      setNextType(randomType());
      if (!spawned) {
        setStatus("over");
        setPiece(null);
      } else {
        setPiece(spawned);
      }
    },
    [level, nextType, spawnPiece]
  );

  const tick = useCallback(() => {
    const g = gridRef.current;
    const p = pieceRef.current;
    if (!p) return;
    const moved = { ...p, row: p.row + 1 };
    if (!collides(g, moved)) {
      setPiece(moved);
    } else {
      lockAndAdvance(g, p);
    }
  }, [lockAndAdvance]);

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(tick, dropMs);
    return () => clearInterval(id);
  }, [status, dropMs, tick]);

  const start = () => {
    const g = emptyGrid();
    setGrid(g);
    setScore(0);
    setLines(0);
    const firstType = randomType();
    setNextType(randomType());
    const spawned = spawnPiece(g, firstType);
    setPiece(spawned);
    setStatus(spawned ? "playing" : "over");
  };

  const move = useCallback(
    (dc: number) => {
      const p = pieceRef.current;
      if (!p || statusRef.current !== "playing") return;
      const moved = { ...p, col: p.col + dc };
      if (!collides(gridRef.current, moved)) setPiece(moved);
    },
    []
  );

  const softDrop = useCallback(() => {
    if (statusRef.current !== "playing") return;
    tick();
  }, [tick]);

  const hardDrop = useCallback(() => {
    const p = pieceRef.current;
    const g = gridRef.current;
    if (!p || statusRef.current !== "playing") return;
    let dropped = p;
    while (!collides(g, { ...dropped, row: dropped.row + 1 })) {
      dropped = { ...dropped, row: dropped.row + 1 };
    }
    lockAndAdvance(g, dropped);
  }, [lockAndAdvance]);

  const rotate = useCallback(() => {
    const p = pieceRef.current;
    if (!p || statusRef.current !== "playing") return;
    const g = gridRef.current;
    const rotated = { ...p, rotation: (p.rotation + 1) % 4 };
    if (!collides(g, rotated)) {
      setPiece(rotated);
      return;
    }
    for (const kick of [-1, 1, -2, 2]) {
      const kicked = { ...rotated, col: rotated.col + kick };
      if (!collides(g, kicked)) {
        setPiece(kicked);
        return;
      }
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== "playing") return;
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowDown") softDrop();
      else if (e.key === "ArrowUp") rotate();
      else if (e.key === " ") hardDrop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, softDrop, rotate, hardDrop]);

  const togglePause = () => {
    if (status === "playing") setStatus("paused");
    else if (status === "paused") setStatus("playing");
  };

  // 보드 + 현재 조각을 합쳐서 그린다.
  const displayGrid: (string | null)[][] = grid.map((row) => [...row]);
  if (piece) {
    for (const [dr, dc] of cellsOf(piece.type, piece.rotation)) {
      const r = piece.row + dr;
      const c = piece.col + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) displayGrid[r][c] = COLOR[piece.type];
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{t("controls")}</span>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-sm border border-neutral-400 p-5 dark:border-neutral-600">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">
            {t("score", { score })}
          </span>
          <span className="font-medium text-neutral-600 dark:text-neutral-300">
            {t("lines", { lines })}
          </span>
          <span className="font-medium text-neutral-600 dark:text-neutral-300">
            {t("level", { level })}
          </span>
          {status === "idle" || status === "over" ? (
            <button
              type="button"
              onClick={start}
              className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {status === "over" ? t("reset") : t("start")}
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePause}
              className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {status === "paused" ? t("resume") : t("pause")}
            </button>
          )}
        </div>

        {status === "over" && <p className="text-sm font-semibold text-red-600">{t("gameOver")}</p>}

        <div
          className="grid gap-px rounded-sm bg-neutral-300 p-1 dark:bg-neutral-700"
          style={{ gridTemplateColumns: `repeat(${COLS}, 20px)`, gridTemplateRows: `repeat(${ROWS}, 20px)` }}
        >
          {displayGrid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className="h-5 w-5 rounded-[2px]"
                style={{ backgroundColor: cell ?? undefined }}
              >
                {!cell && <div className="h-full w-full bg-white dark:bg-neutral-900" />}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 sm:hidden">
          <button type="button" onClick={() => move(-1)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600">◀</button>
          <button type="button" onClick={rotate} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600">⟳</button>
          <button type="button" onClick={softDrop} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600">▼</button>
          <button type="button" onClick={() => move(1)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600">▶</button>
          <button type="button" onClick={hardDrop} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600">⤓</button>
        </div>
      </div>
    </div>
  );
}
