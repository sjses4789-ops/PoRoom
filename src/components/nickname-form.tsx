"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { setNickname } from "@/lib/profile";
import type { ActionResult } from "@/lib/rooms";

export function NicknameForm({
  defaultValue = "",
  redirectTo,
  submitLabel,
}: {
  defaultValue?: string;
  redirectTo: string;
  submitLabel?: string;
}) {
  const t = useTranslations("common");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    setNickname,
    null
  );

  return (
    <form action={formAction} className="flex w-full max-w-xs flex-col gap-2">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {/* 입력칸과 '변경' 버튼을 한 줄에 나란히 — 버튼이 입력칸 아래에
          따로 떨어져 있는 것보다 훨씬 짧고 명확하다. */}
      <div className="flex gap-2">
        <input
          name="nickname"
          defaultValue={defaultValue}
          maxLength={20}
          placeholder={t("nicknamePlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? t("saving") : (submitLabel ?? t("save"))}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </form>
  );
}
