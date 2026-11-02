"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitConsent } from "@/lib/consent";
import type { ActionResult } from "@/lib/rooms";
import { ConsentFields } from "@/components/consent-fields";

export function ConsentForm() {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(submitConsent, null);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-6">
      <ConsentFields />
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? tCommon("saving") : t("consentSubmit")}
      </button>
    </form>
  );
}
