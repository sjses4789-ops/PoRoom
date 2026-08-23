"use client";

import { useActionState } from "react";
import { joinRoomByCode, type ActionResult } from "@/lib/rooms";

export default function InviteCodeButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    joinRoomByCode,
    null
  );

  return (
    <>
      <button
        onClick={onToggle}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
      >
        초대코드로 입장
      </button>
      {open && (
        <>
          <div onClick={onToggle} className="fixed inset-0 z-10 bg-neutral-900/20" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex w-[min(16rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-md border border-neutral-300 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
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
                {pending ? "입장 중..." : "입장하기"}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
