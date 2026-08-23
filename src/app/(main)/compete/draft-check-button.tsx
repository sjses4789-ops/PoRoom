"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markDraftDone } from "@/lib/system-challenges-actions";

export function DraftCheckButton({ alreadyDone }: { alreadyDone: boolean }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(alreadyDone);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (done) {
    return (
      <span className="self-start rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
        이번 달 초단 완고 완료 ✅
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await markDraftDone();
          setPending(false);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          setDone(true);
          router.refresh();
        }}
        className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {pending ? "기록 중..." : "초단 완고 체크"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
