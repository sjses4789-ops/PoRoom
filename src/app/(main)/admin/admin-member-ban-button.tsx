"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { adminSetBanned } from "@/lib/admin";

export function AdminMemberBanButton({
  userId,
  userName,
  banned,
}: {
  userId: string;
  userName: string;
  banned: boolean;
}) {
  const t = useTranslations("admin");
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        const confirmMsg = banned ? t("unbanConfirm", { name: userName }) : t("banConfirm", { name: userName });
        if (!window.confirm(confirmMsg)) return;
        setPending(true);
        await adminSetBanned(userId, !banned);
        setPending(false);
      }}
      className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
        banned
          ? "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          : "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      }`}
    >
      {pending ? t("deleting") : banned ? t("unban") : t("ban")}
    </button>
  );
}
