"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TypingPractice } from "./typing-practice";
import { RestBoard, type RestPost } from "./rest-board";
import type { RestPostCategory, JoinedRoom } from "@/lib/rest";

type View = "typing" | RestPostCategory;

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
        <button
          onClick={() => setView("typing")}
          className={`shrink-0 rounded-sm px-3 py-1.5 text-left text-sm font-medium transition ${
            view === "typing"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          {t("typing")}
        </button>
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
