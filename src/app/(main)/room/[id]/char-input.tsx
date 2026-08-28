"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { setDailyCharGoal } from "@/lib/daily-goal";

export function CharInput({
  todayChars,
  todayGoalChars,
  onAdd,
  onActivity,
  position = "novelist",
}: {
  todayChars: number;
  todayGoalChars: number;
  onAdd: (n: number) => void;
  onActivity?: () => void;
  // 웹툰 작가는 "시작 전/현재 글자수"로 델타를 계산하는 방식 대신, 오늘
  // 작업한 컷 수를 그때그때 더하는 훨씬 단순한 입력으로 바뀐다.
  position?: "novelist" | "webtoon";
}) {
  const isWebtoon = position === "webtoon";
  const t = useTranslations("room.charInput");
  const tw = useTranslations("room.charInput.webtoon");
  const tCommon = useTranslations("room.common");
  const unit = isWebtoon ? tCommon("cutUnit") : tCommon("charUnit");
  const [baseline, setBaseline] = useState("0");
  const [current, setCurrent] = useState("");
  const [cutInput, setCutInput] = useState("");
  const [goalChars, setGoalChars] = useState(todayGoalChars);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(String(todayGoalChars || ""));
  const [goalPending, setGoalPending] = useState(false);

  const baselineNum = Number(baseline) || 0;
  // Number("")는 0이라서, "현재 글자수"를 아직 안 쳤을 때 currentNum이
  // 그대로 0이 되어 delta가 -baselineNum(큰 음수)으로 나오는 문제가
  // 있었다 — 비어있으면 시작 전 글자수와 같다고 보고(=변화 없음) 0을
  // 유지한다.
  const currentNum = current.trim() === "" ? baselineNum : Number(current) || 0;
  const delta = currentNum - baselineNum;

  const calculate = () => {
    if (delta === 0) return;
    onAdd(delta);
    setBaseline(String(currentNum));
    setCurrent("");
  };

  const cutCount = Math.max(0, Math.floor(Number(cutInput)) || 0);
  const addCuts = () => {
    if (cutCount <= 0) return;
    onAdd(cutCount);
    setCutInput("");
  };

  const saveGoal = async () => {
    const value = Math.max(0, Math.floor(Number(goalInput)) || 0);
    setGoalPending(true);
    await setDailyCharGoal(value);
    setGoalPending(false);
    setGoalChars(value);
    setGoalOpen(false);
  };

  const goalProgress = goalChars > 0 ? Math.min(1, todayChars / goalChars) : 0;
  const goalReached = goalChars > 0 && todayChars >= goalChars;

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-sm border border-neutral-400 p-4 dark:border-neutral-600">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {isWebtoon ? tw("title") : t("title")}
        </h3>
        <button
          type="button"
          onClick={() => {
            setGoalInput(String(goalChars || ""));
            setGoalOpen(true);
          }}
          aria-label={isWebtoon ? tw("setGoalAria") : t("setGoalAria")}
          title={isWebtoon ? tw("setGoalAria") : t("setGoalAria")}
          className="rounded-md border border-neutral-200 p-1.5 text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          ⚙️
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="text-neutral-500 dark:text-neutral-400">
            {isWebtoon ? tw("todayGoalLabel") : t("todayGoalLabel")}
          </span>
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            {todayChars.toLocaleString()}
            {goalChars > 0 && ` / ${goalChars.toLocaleString()}`}
            {unit}
          </span>
        </div>
        {goalChars > 0 ? (
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-full rounded-full transition-all ${
                goalReached ? "bg-emerald-500" : "bg-neutral-900 dark:bg-white"
              }`}
              style={{ width: `${goalProgress * 100}%` }}
            />
          </div>
        ) : (
          <p className="text-[12px] text-neutral-400">
            {isWebtoon ? tw("setGoalHint") : t("setGoalHint")}
          </p>
        )}
      </div>

      {isWebtoon ? (
        // 웹툰은 "시작 전/현재" 델타 계산이 아니라, 오늘 작업한 컷 수를
        // 그때그때 바로 더하는 훨씬 단순한 입력이다(요청: "단순하게
        // 컷수입력으로 함").
        <div className="flex items-end gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-neutral-500">
            {tw("cutCountLabel")}
            <input
              type="number"
              min={0}
              value={cutInput}
              onChange={(e) => {
                setCutInput(e.target.value);
                onActivity?.();
              }}
              onKeyDown={(e) => e.key === "Enter" && addCuts()}
              placeholder={tw("cutCountPlaceholder")}
              className="w-full min-w-0 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
          </label>
          <button
            onClick={addCuts}
            disabled={cutCount <= 0}
            className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {tw("addLabel")}
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-neutral-500">
              {t("startChars")}
              <input
                type="number"
                min={0}
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
                className="w-full min-w-0 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-neutral-500">
              {t("currentChars")}
              <input
                type="number"
                min={0}
                value={current}
                onChange={(e) => {
                  setCurrent(e.target.value);
                  onActivity?.();
                }}
                onKeyDown={(e) => e.key === "Enter" && calculate()}
                placeholder={t("currentCharsPlaceholder")}
                className="w-full min-w-0 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[12px] ${delta < 0 ? "text-red-500" : "text-neutral-400"}`}>
              {t("deltaLabel", { delta: `${delta > 0 ? "+" : ""}${delta.toLocaleString()}` })}
            </span>
            <button
              onClick={calculate}
              disabled={delta === 0}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {t("calculate")}
            </button>
          </div>
        </>
      )}

      {goalOpen && (
        <>
          <div
            onClick={() => setGoalOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 w-[min(18rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">
              {isWebtoon ? tw("todayGoalLabel") : t("todayGoalLabel")}
            </p>
            <p className="mb-3 text-[12px] text-neutral-400">
              {isWebtoon ? tw("goalModalHint") : t("goalModalHint")}
            </p>
            <input
              autoFocus
              type="number"
              min={0}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveGoal()}
              placeholder={isWebtoon ? tw("goalPlaceholder") : t("goalPlaceholder")}
              className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
            <div className="mt-3 flex gap-1.5">
              <button
                onClick={saveGoal}
                disabled={goalPending}
                className="flex-1 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {goalPending ? t("saving") : t("save")}
              </button>
              <button
                onClick={() => setGoalOpen(false)}
                className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
