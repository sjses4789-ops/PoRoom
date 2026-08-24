"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateShareRecords } from "@/lib/rooms";

export function ShareRecordsToggle({
  roomId,
  initialShare,
}: {
  roomId: string;
  initialShare: boolean;
}) {
  const t = useTranslations("room.shareRecordsToggle");
  const [share, setShare] = useState(initialShare);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    const next = !share;
    setShare(next);
    setPending(true);
    await updateShareRecords(roomId, next);
    setPending(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
        share
          ? "border-neutral-900 text-neutral-900 dark:text-white"
          : "border-neutral-200 text-neutral-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${share ? "bg-neutral-900" : "bg-neutral-300"}`}
      />
      {t("label")} {share ? t("public") : t("private")}
    </button>
  );
}
