"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// 초대 링크(/invite/room/<코드> 또는 /invite/duel/<코드>)를 복사한다. 링크를 연 사람이 로그인하지 않았다면
// 로그인 안내 팝업이 뜨고, 로그인하면 그 방·대결에 바로 입장하는 화면으로 이어진다.
export function InviteLinkButton({
  kind,
  code,
  className,
}: {
  kind: "room" | "duel";
  code: string;
  className?: string;
}) {
  const t = useTranslations("invite");
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    // 카드 전체가 링크인 곳(대결 카드)에서 이 버튼을 눌러도 페이지 이동은 하지 않는다.
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/invite/${kind}/${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        "rounded-md border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }
    >
      {copied ? t("copied") : t("copyLink")}
    </button>
  );
}
