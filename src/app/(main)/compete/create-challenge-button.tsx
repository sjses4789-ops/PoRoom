"use client";

import { useActionState, useState } from "react";
import { createChallenge } from "@/lib/challenges";
import type { ActionResult } from "@/lib/rooms";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CreateChallengeButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createChallenge,
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
      >
        새 대결 만들기
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex max-h-[85vh] w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <form action={formAction} className="flex flex-col gap-3">
            <input
              name="title"
              placeholder="대결 이름"
              className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                기준
              </span>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="metric"
                    value="chars"
                    defaultChecked
                    className="accent-neutral-900"
                  />
                  글자수
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="metric"
                    value="minutes"
                    className="accent-neutral-900"
                  />
                  작업시간
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                공개 설정
              </span>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="visibility"
                    value="open"
                    defaultChecked
                    className="accent-neutral-900"
                  />
                  공개방
                </label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    className="accent-neutral-900"
                  />
                  비공개방 (초대코드)
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                name="startDate"
                type="date"
                defaultValue={todayPlus(0)}
                className="w-1/2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
              />
              <input
                name="endDate"
                type="date"
                defaultValue={todayPlus(7)}
                className="w-1/2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400"
              />
            </div>

            <p className="text-[12px] text-neutral-400">
              대결을 만들면 자동으로 참가하게 돼요. 공개방은 대결 목록에서
              누구나 참여할 수 있고, 비공개방은 초대코드로만 참여할 수
              있어요.
            </p>

            {state?.error && (
              <p className="text-xs text-red-500">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {pending ? "만드는 중..." : "만들기"}
            </button>
          </form>
          </div>
        </>
      )}
    </>
  );
}
