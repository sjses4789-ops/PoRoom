"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createNickname, type NicknameItem } from "@/lib/nicknames";
import { MAX_EXTRA_NICKNAMES, MAX_NICKNAME_LENGTH } from "@/lib/nickname-limits";

// 방에서 쓸 닉네임을 고르는 안내창(방 입장 전 / 입장 후 변경 둘 다 이걸 쓴다).
// onSelect는 고른 닉네임 id(기본 닉네임이면 null)를 받아 처리하고, 실패하면 오류 문구를 돌려준다.
export function NicknamePicker({
  defaultName,
  nicknames: initialNicknames,
  currentNickname,
  forced,
  onSelect,
  onClose,
}: {
  defaultName: string;
  nicknames: NicknameItem[];
  // 이미 이 방에서 쓰고 있는 닉네임(null이면 기본 닉네임) — "사용 중" 표시용. 입장 전에는 undefined.
  currentNickname?: string | null;
  // true면 닫을 수 없다(반드시 하나를 골라야 함).
  forced: boolean;
  onSelect: (nicknameId: string | null) => Promise<string | null>;
  onClose: () => void;
}) {
  const t = useTranslations("room.nicknameDialog");
  const [showOther, setShowOther] = useState(false);
  const [nicknames, setNicknames] = useState(initialNicknames);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canCreate = nicknames.length < MAX_EXTRA_NICKNAMES;
  const hasCurrent = currentNickname !== undefined;

  const choose = async (nicknameId: string | null) => {
    setPending(true);
    setError(null);
    const message = await onSelect(nicknameId);
    setPending(false);
    if (message) setError(message);
  };

  const createAndUse = async () => {
    if (!input.trim()) return;
    setPending(true);
    setError(null);
    const created = await createNickname(input);
    if ("error" in created) {
      setPending(false);
      setError(created.error);
      return;
    }
    setNicknames((prev) => [...prev, created]);
    await choose(created.id);
  };

  return (
    <>
      <div
        onClick={() => {
          if (!forced && !pending) onClose();
        }}
        className="fixed inset-0 z-30 bg-neutral-900/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="fixed left-1/2 top-1/2 z-40 flex max-h-[85vh] w-[min(24rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-md border border-neutral-300 bg-white p-5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            {hasCurrent ? t("titleChange") : t("titleFirst")}
          </p>
          {!forced && (
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              aria-label={t("close")}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              ✕
            </button>
          )}
        </div>

        {!showOther ? (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {t("askDefault", { name: defaultName })}
            </p>
            <p className="text-[12px] text-neutral-400">{t("scopeHint")}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => choose(null)}
                disabled={pending}
                className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {t("useDefault")}
                {currentNickname === null ? ` · ${t("inUse")}` : ""}
              </button>
              <button
                type="button"
                onClick={() => setShowOther(true)}
                disabled={pending}
                className="rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t("useOther")}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
              {t("otherHint", { max: MAX_EXTRA_NICKNAMES + 1 })}
            </p>
            {nicknames.length > 0 && (
              <div className="flex flex-col gap-1">
                {nicknames.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => choose(n.id)}
                    disabled={pending}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition disabled:opacity-50 ${
                      currentNickname === n.nickname
                        ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                        : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate">{n.nickname}</span>
                    {currentNickname === n.nickname && (
                      <span className="shrink-0 text-[11px] text-neutral-400">{t("inUse")}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {canCreate ? (
              <div className="flex gap-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createAndUse()}
                  maxLength={MAX_NICKNAME_LENGTH}
                  placeholder={t("createPlaceholder")}
                  className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={createAndUse}
                  disabled={pending || !input.trim()}
                  className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {pending ? t("saving") : t("createAndUse")}
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-neutral-400">
                {t("limitReached", { max: MAX_EXTRA_NICKNAMES + 1 })}
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowOther(false)}
              disabled={pending}
              className="self-start text-[12px] text-neutral-400 underline-offset-2 hover:underline"
            >
              {t("back")}
            </button>
          </>
        )}

        {error && <p className="text-[12px] text-red-500">{error}</p>}
      </div>
    </>
  );
}
