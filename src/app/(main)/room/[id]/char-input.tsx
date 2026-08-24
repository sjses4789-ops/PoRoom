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
}: {
  todayChars: number;
  todayGoalChars: number;
  initialWorks: WorkItem[];
  onAdd: (n: number) => void;
  onActivity?: () => void;
}) {
  const t = useTranslations("room.charInput");
  const tCommon = useTranslations("room.common");
  const [baseline, setBaseline] = useState("0");
  const [current, setCurrent] = useState("");
  const [goalChars, setGoalChars] = useState(todayGoalChars);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(String(todayGoalChars || ""));
  const [goalPending, setGoalPending] = useState(false);

  const [works, setWorks] = useState<WorkItem[]>(initialWorks ?? []);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [workPickerOpen, setWorkPickerOpen] = useState(false);
  const [addingWork, setAddingWork] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [workPending, setWorkPending] = useState(false);

  const baselineNum = Number(baseline) || 0;
  const currentNum = Number(current) || 0;
  const delta = currentNum - baselineNum;

  const selectWork = (work: WorkItem | null) => {
    setActiveWorkId(work?.id ?? null);
    setBaseline(String(work?.lastCurrentChars ?? 0));
    setCurrent("");
  };

  const calculate = () => {
    if (delta === 0) return;
    onAdd(delta);
    if (activeWorkId) {
      recordWorkChars(activeWorkId, delta, currentNum);
      setWorks((prev) =>
        prev.map((w) => (w.id === activeWorkId ? { ...w, lastCurrentChars: currentNum } : w))
      );
    }
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
    if (activeWorkId === workId) selectWork(null);
  };

  const activeWork = works.find((w) => w.id === activeWorkId) ?? null;

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
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h3>
        <button
          type="button"
          onClick={() => {
            setGoalInput(String(goalChars || ""));
            setGoalOpen(true);
          }}
          aria-label={t("setGoalAria")}
          title={t("setGoalAria")}
          className="rounded-md border border-neutral-200 p-1.5 text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          ⚙️
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="text-neutral-500 dark:text-neutral-400">{t("todayGoalLabel")}</span>
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            {todayChars.toLocaleString()}
            {goalChars > 0 && ` / ${goalChars.toLocaleString()}`}
            {tCommon("charUnit")}
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
            {t("setGoalHint")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
          {t("recordByWork")}
        </span>
        <button
          type="button"
          onClick={() => setWorkPickerOpen(true)}
          className="flex items-center justify-between rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <span className="truncate">{activeWork ? activeWork.title : t("notSelected")}</span>
          <span className="text-neutral-400">▾</span>
        </button>
      </div>

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
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  selectWork(null);
                  setWorkPickerOpen(false);
                }}
                className={`rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                  !activeWorkId
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {t("notSelected")}
              </button>
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

      <div className="flex gap-2">
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
              {t("todayGoalLabel")}
            </p>
            <p className="mb-3 text-[12px] text-neutral-400">
              {t("goalModalHint")}
            </p>
            <input
              autoFocus
              type="number"
              min={0}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveGoal()}
              placeholder={t("goalPlaceholder")}
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
