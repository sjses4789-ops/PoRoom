"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { leaveChallenge } from "@/lib/challenges";

export function LeaveChallengeButton({ challengeId }: { challengeId: string }) {
  const t = useTranslations("compete.leaveChallengeButton");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!window.confirm(t("confirm"))) return;
        setPending(true);
        const result = await leaveChallenge(challengeId);
        setPending(false);
        if ("error" in result) {
          window.alert(result.error);
          return;
        }
        router.push("/compete");
        router.refresh();
      }}
      className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
    >
      {pending ? t("leaving") : t("giveUp")}
    </button>
  );
}
