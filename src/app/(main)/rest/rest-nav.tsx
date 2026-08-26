"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { TypingPractice } from "./typing-practice";
import { RestBoard, type RestPost } from "./rest-board";
import type { JoinedRoom } from "@/lib/rest";
import type { RestPostCategory } from "@/lib/rest-types";

// 게임들은 시작 상태에 Math.random()을 쓰기 때문에(시작 단어, 초성 퀴즈
// 등) 서버에서 미리 렌더링하면 서버와 클라이언트가 서로 다른 값을 그려
// 하이드레이션 오류가 난다 — 그래서 클라이언트에서만 렌더링한다.
// 지뢰찾기·테트리스는 글쓰기와 관련 없는 게임이라 잠시 숨겨뒀다
// (컴포넌트 파일은 그대로 남아 있어 다시 노출하기만 하면 된다).
const WordChain = dynamic(() => import("./word-chain").then((m) => m.WordChain), { ssr: false });
const ChoseongQuiz = dynamic(() => import("./choseong-quiz").then((m) => m.ChoseongQuiz), {
  ssr: false,
});

type GameView = "typing" | "wordChain" | "choseong";
type View = GameView | RestPostCategory;

const GAME_VIEWS: GameView[] = ["typing", "choseong", "wordChain"];

const BOARD_CATEGORIES: RestPostCategory[] = ["정보", "인원 모집"];

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
        ) : view === "wordChain" ? (
          <WordChain />
        ) : view === "choseong" ? (
          <ChoseongQuiz />
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
