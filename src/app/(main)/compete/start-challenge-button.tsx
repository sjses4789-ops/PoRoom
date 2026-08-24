"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { startChallenge } from "@/lib/challenges";

export function StartChallengeButton({
  challengeId,
  participantCount,
}: {
  challengeId: string;
  participantCount: number;
}) {
  const t = useTranslations("compete.startChallengeButton");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending || participantCount < 2}
        onClick={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const result = await startChallenge(challengeId);
          setPending(false);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
        className="self-start rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
      >
        {pending ? t("starting") : t("start")}
      </button>
      <p className="text-[11px] text-neutral-400">
        {participantCount < 2 ? t("needMoreParticipants") : t("readyHint")}
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
