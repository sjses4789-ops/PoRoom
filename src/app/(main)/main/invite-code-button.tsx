"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { joinRoomByCode, type ActionResult } from "@/lib/rooms";
import { useNicknameChooser } from "@/components/use-nickname-chooser";

export default function InviteCodeButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("main.inviteCode");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    joinRoomByCode,
    null
  );
  const chooser = useNicknameChooser();
  const confirmedRef = useRef(false);
  const nicknameInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        onClick={onToggle}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
      >
        {t("trigger")}
      </button>
      {open && (
        <>
          <div onClick={onToggle} className="fixed inset-0 z-10 bg-neutral-900/20" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex w-[min(16rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded-md border border-neutral-300 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            <form
              action={formAction}
              onSubmit={async (e) => {
                // 입장하기 전에 이 방에서 쓸 닉네임부터 고른다 — 고른 뒤 같은 폼을 다시 제출한다.
                if (confirmedRef.current) {
                  confirmedRef.current = false;
                  return;
                }
                e.preventDefault();
                const form = e.currentTarget;
                const choice = await chooser.ask();
                if (!choice) return;
                if (nicknameInputRef.current) nicknameInputRef.current.value = choice.nicknameId ?? "";
                confirmedRef.current = true;
                form.requestSubmit();
              }}
              className="flex flex-col gap-2"
            >
              <input ref={nicknameInputRef} type="hidden" name="nicknameId" defaultValue="" />
              <input
                name="code"
                placeholder={t("placeholder")}
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
                {pending ? t("entering") : t("enter")}
              </button>
            </form>
          </div>
        </>
      )}
      {chooser.element}
    </>
  );
}
