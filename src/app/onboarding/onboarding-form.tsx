"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { completeOnboarding, type ProfilePosition } from "@/lib/profile";
import type { ActionResult } from "@/lib/rooms";
import { CharacterPicker } from "../(main)/me/character-picker";

const POSITIONS: ProfilePosition[] = ["novelist", "webtoon"];

export function OnboardingForm({
  defaultNickname,
  initialCharacterId,
}: {
  defaultNickname: string;
  initialCharacterId: string | null;
}) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    completeOnboarding,
    null
  );
  const [position, setPosition] = useState<ProfilePosition | null>(null);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-6">
      <input type="hidden" name="redirectTo" value="/main" />
      <input type="hidden" name="position" value={position ?? ""} />

      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold text-neutral-500">{t("nicknameLabel")}</h2>
        <input
          name="nickname"
          defaultValue={defaultNickname}
          maxLength={20}
          placeholder={tCommon("nicknamePlaceholder")}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold text-neutral-500">{t("characterLabel")}</h2>
        <CharacterPicker initialCharacterId={initialCharacterId} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold text-neutral-500">{t("positionLabel")}</h2>
        <div className="grid grid-cols-2 gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPosition(p)}
              className={`rounded-md border-2 px-3 py-3 text-sm font-medium transition ${
                position === p
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {t(`position.${p}`)}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-neutral-400">{t("positionHint")}</p>
      </div>

      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? tCommon("saving") : t("start")}
      </button>
    </form>
  );
}
