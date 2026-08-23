"use client";

import { useActionState, useState } from "react";
import { joinChallengeByCode } from "@/lib/challenges";
import type { ActionResult } from "@/lib/rooms";

export default function JoinByCodeButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    joinChallengeByCode,
    null
  );

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        초대코드로 참여
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex w-[min(16rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-md border border-neutral-300 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <form action={formAction} className="flex flex-col gap-2">
              <input
                name="code"
                placeholder="초대코드 입력"
                maxLength={6}
                className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm uppercase text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
              />
              {state?.error && (
                <p className="text-xs text-red-500">{state.error}</p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {pending ? "참여 중..." : "참여하기"}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
