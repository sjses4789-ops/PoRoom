"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminMemberBanButton } from "./admin-member-ban-button";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  isBanned: boolean;
  position: "novelist" | "webtoon" | null;
};

export function AdminMemberList({ users, selfId }: { users: AdminUserRow[]; selfId: string }) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div className="flex flex-col gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("memberSearchPlaceholder")}
        className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white outline-none focus:border-neutral-400"
      />
      <ul className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-neutral-400">{t("memberSearchEmpty")}</p>
        ) : (
          filtered.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 flex-wrap items-center gap-1.5 truncate font-medium text-neutral-900 dark:text-white">
                  {u.name ?? u.email}
                  {u.position && (
                    <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                      {u.position === "webtoon" ? t("positionWebtoon") : t("positionNovelist")}
                    </span>
                  )}
                  {u.isBanned && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                      {t("bannedTag")}
                    </span>
                  )}
                </span>
                <span className="min-w-0 truncate text-[11px] text-neutral-400">{u.email}</span>
              </div>
              {u.id !== selfId && (
                <AdminMemberBanButton userId={u.id} userName={u.name ?? u.email} banned={u.isBanned} />
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
