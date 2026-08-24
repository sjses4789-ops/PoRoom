"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { adminDeleteChallenge } from "@/lib/admin";

export function AdminEventDeleteButton({ challengeId }: { challengeId: string }) {
  const t = useTranslations("admin");
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await adminDeleteChallenge(challengeId);
        setPending(false);
      }}
      className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
    >
      {pending ? t("deleting") : t("deleteEvent")}
    </button>
  );
}
