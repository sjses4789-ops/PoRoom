"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createNickname, setRoomNickname, type NicknameItem } from "@/lib/nicknames";
import { MAX_EXTRA_NICKNAMES, MAX_NICKNAME_LENGTH } from "@/lib/nickname-limits";

// 방마다 쓸 닉네임을 고르는 안내창. 방에 처음 입장하면(nicknameSet=false) 닫을 수 없는 상태로 자동으로
// 뜨고, 그 뒤로는 버튼을 눌러 언제든 이 방의 닉네임을 바꿀 수 있다. 고른 닉네임은 이 방에서만 쓰인다.
export function RoomNickname({
  roomId,
  defaultName,
  currentNickname,
  nicknameSet,
  initialNicknames,
}: {
  roomId: string;
  defaultName: string;
  currentNickname: string | null;
  nicknameSet: boolean;
  initialNicknames: NicknameItem[];
}) {
  const t = useTranslations("room.nicknameDialog");
  const router = useRouter();
  const [open, setOpen] = useState(!nicknameSet);
  const [forced, setForced] = useState(!nicknameSet);
  const [showOther, setShowOther] = useState(false);
  const [nicknames, setNicknames] = useState(initialNicknames);
  const [current, setCurrent] = useState<string | null>(currentNickname);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canCreate = nicknames.length < MAX_EXTRA_NICKNAMES;

  const finish = (nickname: string | null) => {
    setCurrent(nickname);
    setOpen(false);
    setForced(false);
    setShowOther(false);
    setInput("");
    setError(null);
    router.refresh();
  };

  const choose = async (nicknameId: string | null) => {
    setPending(true);
    setError(null);
    const result = await setRoomNickname(roomId, nicknameId);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    finish(result.nickname);
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

  const shownName = current ?? defaultName;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setShowOther(false);
        }}
        title={t("buttonTitle")}
        className="max-w-[10rem] truncate rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {t("buttonLabel", { name: shownName })}
      </button>

      {open && (
        <>
          <div
            onClick={() => {
              if (!forced && !pending) setOpen(false);
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
                {forced ? t("titleFirst") : t("titleChange")}
              </p>
              {!forced && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
                    {current === null && !forced ? ` · ${t("inUse")}` : ""}
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
                          current === n.nickname
                            ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                            : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        }`}
                      >
                        <span className="truncate">{n.nickname}</span>
                        {current === n.nickname && (
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
                  <p className="text-[12px] text-neutral-400">{t("limitReached", { max: MAX_EXTRA_NICKNAMES + 1 })}</p>
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
      )}
    </>
  );
}
