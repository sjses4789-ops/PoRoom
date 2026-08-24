"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { joinChallenge } from "@/lib/challenges";

export function JoinChallengeButton({ challengeId }: { challengeId: string }) {
  const t = useTranslations("compete.joinChallengeButton");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1.5">
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await joinChallenge(challengeId);
          setPending(false);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? t("joining") : t("join")}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
