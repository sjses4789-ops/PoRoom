"use client";

import { useState } from "react";
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
    if (!window.confirm(`"${work.title}" 작품을 목록에서 삭제할까요? 기록된 글자수 그래프는 유지돼요.`)) {
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
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">글자수 기록</h3>
        <button
          type="button"
          onClick={() => {
            setGoalInput(String(goalChars || ""));
            setGoalOpen(true);
          }}
          aria-label="오늘의 목표 글자수 설정"
          title="오늘의 목표 글자수 설정"
          className="rounded-md border border-neutral-200 p-1.5 text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          ⚙️
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="text-neutral-500 dark:text-neutral-400">오늘의 목표 글자수</span>
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            {todayChars.toLocaleString()}
            {goalChars > 0 && ` / ${goalChars.toLocaleString()}`}자
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
            ⚙️ 버튼으로 오늘의 목표 글자수를 설정해보세요.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
          작품별로 기록하기 (선택)
        </span>
        <button
          type="button"
          onClick={() => setWorkPickerOpen(true)}
          className="flex items-center justify-between rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <span className="truncate">{activeWork ? activeWork.title : "선택 안 함"}</span>
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
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">작품 선택</p>
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
                선택 안 함
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
                    title="작품 삭제"
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
                  placeholder="작품 이름"
                  className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                />
                <button
                  type="button"
                  onClick={confirmAddWork}
                  disabled={workPending}
                  className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  추가
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingWork(true)}
                className="rounded-md border border-dashed border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                + 작품 추가
              </button>
            )}
          </div>
        </>
      )}

      <div className="flex gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-neutral-500">
          시작 전 글자수
          <input
            type="number"
            min={0}
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            className="w-full min-w-0 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-neutral-500">
          현재 글자수
          <input
            type="number"
            min={0}
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              onActivity?.();
            }}
            onKeyDown={(e) => e.key === "Enter" && calculate()}
            placeholder="지금까지 쓴 총 글자수"
            className="w-full min-w-0 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
          />
        </label>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[12px] ${delta < 0 ? "text-red-500" : "text-neutral-400"}`}>
          이번에 기록될 글자수: {delta > 0 ? "+" : ""}
          {delta.toLocaleString()}자
        </span>
        <button
          onClick={calculate}
          disabled={delta === 0}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          계산해서 기록
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
              오늘의 목표 글자수
            </p>
            <p className="mb-3 text-[12px] text-neutral-400">
              오늘 설정한 목표는 오늘과 이후 날짜에 계속 적용돼요. 다시
              바꾸면 그 시점부터 새 값이 적용돼요.
            </p>
            <input
              autoFocus
              type="number"
              min={0}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveGoal()}
              placeholder="예: 3000"
              className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
            <div className="mt-3 flex gap-1.5">
              <button
                onClick={saveGoal}
                disabled={goalPending}
                className="flex-1 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {goalPending ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={() => setGoalOpen(false)}
                className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
