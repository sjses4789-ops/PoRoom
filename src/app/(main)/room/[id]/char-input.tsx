"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { setDailyCharGoal } from "@/lib/daily-goal";
import { createWork, deleteWork, recordWorkChars } from "@/lib/works";

export type WorkItem = { id: string; title: string; lastCurrentChars: number };

export function CharInput({
  todayChars,
  todayGoalChars,
  initialWorks,
  onAdd,
  onActivity,
  position = "novelist",
}: {
  todayChars: number;
  todayGoalChars: number;
  // 웹툰(컷수) 입력엔 작품 선택이 필요 없어 빈 배열이어도 된다.
  initialWorks: WorkItem[];
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

  // 작품별 글자수 데이터가 하루 총 글자수와 따로 관리되면서 어긋나는
  // 문제가 있었던 예전 기능을 다시 들여오면서, 이번엔 작품 선택을
  // 필수로 만들었다 — 글자수를 기록할 때마다 항상 같은 입력 하나가
  // daily_records(onAdd)와 work_records(recordWorkChars)에 나란히
  // 쌓여서 두 총합이 절대 어긋나지 않는다.
  const [works, setWorks] = useState<WorkItem[]>(initialWorks ?? []);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [workPickerOpen, setWorkPickerOpen] = useState(false);
  const [addingWork, setAddingWork] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [workPending, setWorkPending] = useState(false);

  const baselineNum = Number(baseline) || 0;
  // Number("")는 0이라서, "현재 글자수"를 아직 안 쳤을 때 currentNum이
  // 그대로 0이 되어 delta가 -baselineNum(큰 음수)으로 나오는 문제가
  // 있었다 — 비어있으면 시작 전 글자수와 같다고 보고(=변화 없음) 0을
  // 유지한다.
  const currentNum = current.trim() === "" ? baselineNum : Number(current) || 0;
  const delta = currentNum - baselineNum;

  const selectWork = (work: WorkItem) => {
    setActiveWorkId(work.id);
    setBaseline(String(work.lastCurrentChars ?? 0));
    setCurrent("");
  };

  const calculate = () => {
    if (delta === 0 || !activeWorkId) return;
    onAdd(delta);
    recordWorkChars(activeWorkId, delta, currentNum);
    setWorks((prev) =>
      prev.map((w) => (w.id === activeWorkId ? { ...w, lastCurrentChars: currentNum } : w))
    );
    setBaseline(String(currentNum));
    setCurrent("");
  };

  const confirmAddWork = async () => {
    const title = newWorkTitle.trim();
    if (!title) return;
    setWorkPending(true);
    const result = await createWork(title);
    setWorkPending(false);
    if ("error" in result) return;
    const work: WorkItem = { id: result.id, title: result.title, lastCurrentChars: 0 };
    setWorks((prev) => [...prev, work]);
    setNewWorkTitle("");
    setAddingWork(false);
    selectWork(work);
  };

  const removeWork = async (workId: string) => {
    const work = works.find((w) => w.id === workId);
    if (!work) return;
    if (!window.confirm(t("deleteWorkConfirm", { title: work.title }))) {
      return;
    }
    await deleteWork(workId);
    setWorks((prev) => prev.filter((w) => w.id !== workId));
    if (activeWorkId === workId) setActiveWorkId(null);
  };

  const activeWork = works.find((w) => w.id === activeWorkId) ?? null;

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
          <div className="flex flex-col gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
              {t("recordByWork")}
            </span>
            <button
              type="button"
              onClick={() => setWorkPickerOpen(true)}
              className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition ${
                activeWork
                  ? "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  : "border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
              }`}
            >
              <span className="truncate">{activeWork ? activeWork.title : t("notSelected")}</span>
              <span className="text-neutral-400">▾</span>
            </button>
          </div>

          <div className="flex gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-neutral-500">
              {t("startChars")}
              <input
                type="number"
                min={0}
                value={baseline}
                disabled={!activeWork}
                onChange={(e) => setBaseline(e.target.value)}
                className="w-full min-w-0 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50 dark:text-white"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-neutral-500">
              {t("currentChars")}
              <input
                type="number"
                min={0}
                value={current}
                disabled={!activeWork}
                onChange={(e) => {
                  setCurrent(e.target.value);
                  onActivity?.();
                }}
                onKeyDown={(e) => e.key === "Enter" && calculate()}
                placeholder={t("currentCharsPlaceholder")}
                className="w-full min-w-0 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 disabled:opacity-50 dark:text-white"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[12px] ${delta < 0 ? "text-red-500" : "text-neutral-400"}`}>
              {t("deltaLabel", { delta: `${delta > 0 ? "+" : ""}${delta.toLocaleString()}` })}
            </span>
            <button
              onClick={calculate}
              disabled={delta === 0 || !activeWork}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {t("calculate")}
            </button>
          </div>
        </>
      )}

      {workPickerOpen && (
        <>
          <div
            onClick={() => {
              setWorkPickerOpen(false);
              setAddingWork(false);
            }}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex max-h-[80vh] w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("selectWorkTitle")}</p>
              <button
                onClick={() => {
                  setWorkPickerOpen(false);
                  setAddingWork(false);
                }}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            {works.length === 0 && (
              <p className="text-xs text-neutral-400">{t("noWorksHint")}</p>
            )}
            <div className="flex flex-col gap-1">
              {works.map((w) => (
                <div key={w.id} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      selectWork(w);
                      setWorkPickerOpen(false);
                    }}
                    className={`flex-1 truncate rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                      activeWorkId === w.id
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {w.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeWork(w.id)}
                    title={t("deleteWorkTitle")}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
            {addingWork ? (
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  value={newWorkTitle}
                  onChange={(e) => setNewWorkTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmAddWork()}
                  placeholder={t("workNamePlaceholder")}
                  className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                />
                <button
                  type="button"
                  onClick={confirmAddWork}
                  disabled={workPending}
                  className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {t("add")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingWork(true)}
                className="rounded-md border border-dashed border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                {t("addWork")}
              </button>
            )}
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
