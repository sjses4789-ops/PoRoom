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

// 이메일의 @ 앞부분(로컬 파트)만 가린다 — 도메인(gmail.com 등)은 그대로
// 두고, 첫 글자는 보여준 뒤 그다음 3글자를 *** 로 가리고 나머지는 다시
// 보여준다(예: sjses4789@gmail.com → s***4789@gmail.com). 검색은 이
// 함수를 거치지 않은 원본 이메일 문자열을 그대로 대상으로 하므로 가려진
// 부분으로도 계속 검색할 수 있다.
function maskEmail(email: string) {
  const at = email.indexOf("@");
  if (at <= 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const first = local.slice(0, 1);
  const rest = local.slice(4);
  return `${first}***${rest}${domain}`;
}

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
                  {u.name ?? maskEmail(u.email)}
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
                <span className="min-w-0 truncate text-[11px] text-neutral-400">{maskEmail(u.email)}</span>
              </div>
              {u.id !== selfId && (
                <AdminMemberBanButton userId={u.id} userName={u.name ?? maskEmail(u.email)} banned={u.isBanned} />
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
