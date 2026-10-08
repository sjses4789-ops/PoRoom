"use client";

import { useState } from "react";
import { publishAdminInfoPosts, type PublishInfoPostsResult } from "@/lib/admin-info-posts-action";

export function PublishInfoPostsButton({ total }: { total: number }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<PublishInfoPostsResult | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(`정보 게시판에 운영자 글 ${total}편을 지금 게시합니다. 계속할까요?`)) return;
          setPending(true);
          setResult(await publishAdminInfoPosts());
          setPending(false);
        }}
        className="self-start rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {pending ? "게시 중... (잠시만 기다려 주세요)" : `정보 게시판에 ${total}편 게시하기`}
      </button>
      {result && (
        <p className="text-xs text-neutral-600 dark:text-neutral-300">
          {"error" in result
            ? result.error
            : `게시 ${result.published}편 · 이미 있어서 건너뜀 ${result.skipped}편${
                result.failed.length ? ` · 실패 ${result.failed.length}편 (${result.failed.join(", ")})` : ""
              }`}
        </p>
      )}
    </div>
  );
}
