"use client";

import { useState } from "react";
import { adminCleanOrphanAccounts } from "@/lib/admin";

// 프로필 없이 로그인 계정만 남은 "고아 계정"을 지운다(예전 탈퇴로 생긴 것들).
export function AdminOrphanButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    if (!window.confirm("프로필이 없는 로그인 계정을 모두 지울까요? 되돌릴 수 없어요.")) return;
    setPending(true);
    setMessage(null);
    const result = await adminCleanOrphanAccounts();
    setPending(false);
    setMessage("error" in result ? result.error : `${result.removed}개 계정을 정리했어요.`);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {pending ? "정리 중..." : "고아 계정 정리"}
      </button>
      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </div>
  );
}
