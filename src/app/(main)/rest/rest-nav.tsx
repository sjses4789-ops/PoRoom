"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { TypingPractice } from "./typing-practice";
import { RestBoard, type RestPost } from "./rest-board";
import type { RestPostCategory, JoinedRoom } from "@/lib/rest";

// 세 게임은 시작 상태에 Math.random()을 쓰기 때문에(지뢰 배치, 시작
// 단어, 다음 조각) 서버에서 미리 렌더링하면 서버와 클라이언트가 서로
// 다른 값을 그려 하이드레이션 오류가 난다 — 그래서 클라이언트에서만
// 렌더링한다.
const Minesweeper = dynamic(() => import("./minesweeper").then((m) => m.Minesweeper), {
  ssr: false,
});
const WordChain = dynamic(() => import("./word-chain").then((m) => m.WordChain), { ssr: false });
const Tetris = dynamic(() => import("./tetris").then((m) => m.Tetris), { ssr: false });

type GameView = "typing" | "minesweeper" | "wordChain" | "tetris";
type View = GameView | RestPostCategory;

const GAME_VIEWS: GameView[] = ["typing", "minesweeper", "wordChain", "tetris"];

const BOARD_CATEGORIES: RestPostCategory[] = ["자유", "정보", "인원 모집"];

export function RestNav({
  selfId,
  selfName,
  isAdmin,
  myBestCpm,
  initialPosts,
  myRooms,
}: {
  selfId: string;
  selfName: string;
  isAdmin: boolean;
  myBestCpm: number | null;
  initialPosts: RestPost[];
  myRooms: JoinedRoom[];
}) {
  const t = useTranslations("rest.nav");
  const tBoard = useTranslations("rest.board");
  const locale = useLocale();
  const [view, setView] = useState<View>("typing");

  return (
    <div className="grid grid-cols-1 gap-4 overflow-hidden rounded-sm border border-neutral-400 p-4 lg:grid-cols-[140px_1fr] dark:border-neutral-600">
      <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:flex-nowrap lg:border-r lg:border-neutral-100 lg:pr-4 dark:lg:border-neutral-800">
        {GAME_VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`shrink-0 rounded-sm px-3 py-1.5 text-left text-sm font-medium transition ${
              view === v
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {t(v)}
          </button>
        ))}
        {BOARD_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setView(c)}
            className={`shrink-0 rounded-sm px-3 py-1.5 text-left text-sm font-medium transition ${
              view === c
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            {tBoard(`category.${c}`)}
          </button>
        ))}
      </div>

      <div>
        {view === "typing" ? (
          <TypingPractice key={locale} myBestCpm={myBestCpm} />
        ) : view === "minesweeper" ? (
          <Minesweeper />
        ) : view === "wordChain" ? (
          <WordChain />
        ) : view === "tetris" ? (
          <Tetris />
        ) : (
          <RestBoard
            category={view}
            selfId={selfId}
            selfName={selfName}
            isAdmin={isAdmin}
            initialPosts={initialPosts}
            myRooms={myRooms}
          />
        )}
      </div>
    </div>
  );
}
