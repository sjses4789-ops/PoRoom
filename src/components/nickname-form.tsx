"use client";

import { useActionState } from "react";
import { setNickname } from "@/lib/profile";
import type { ActionResult } from "@/lib/rooms";

export function NicknameForm({
  defaultValue = "",
  redirectTo,
  submitLabel = "저장",
}: {
  defaultValue?: string;
  redirectTo: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    setNickname,
    null
  );

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-2">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input
        name="nickname"
        defaultValue={defaultValue}
        maxLength={20}
        placeholder="닉네임"
        className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
      />
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
