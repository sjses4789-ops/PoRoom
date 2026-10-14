"use client";

import { useState } from "react";
import { adminPurgeExpiredChatImages } from "@/lib/admin";

// 보관 기간이 지난 채팅 사진 파일 정리 — 사진은 30일이 지나면 이미 열리지 않고, 이 버튼이 실제 파일을 지운다.
export function AdminPurgePhotosButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setPending(true);
    setMessage(null);
    const result = await adminPurgeExpiredChatImages();
    setPending(false);
    setMessage("error" in result ? result.error : `${result.removed}개 파일을 지웠어요.${result.removed >= 200 ? " 더 남아 있을 수 있으니 한 번 더 눌러 주세요." : ""}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {pending ? "정리 중..." : "만료된 채팅 사진 정리"}
      </button>
      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </div>
  );
}
