"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { joinRoomByCode } from "@/lib/rooms";
import { joinChallengeByCode } from "@/lib/challenges";
import { useLoginGate } from "@/components/login-gate";
import { useNicknameChooser } from "@/components/use-nickname-chooser";

export function InviteJoin({
  kind,
  code,
  loggedIn,
  info,
}: {
  kind: "room" | "duel";
  code: string;
  loggedIn: boolean;
  info: { name: string; memberCount: number | null } | null;
}) {
  const t = useTranslations("invite");
  const router = useRouter();
  const gate = useLoginGate();
  const chooser = useNicknameChooser();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 비로그인으로 링크를 열면 곧바로 로그인 안내 팝업을 띄운다(닫아도 아래 버튼으로 다시 열 수 있다).
  const askedRef = useRef(false);
  useEffect(() => {
    if (loggedIn || askedRef.current) return;
    askedRef.current = true;
    gate.requireLogin();
  }, [loggedIn, gate]);

  const join = async () => {
    if (!gate.requireLogin()) return;
    setError(null);
    const formData = new FormData();
    formData.set("code", code);
    if (kind === "room") {
      // 입장하기 전에 이 방에서 쓸 닉네임부터 고른다.
      const choice = await chooser.ask();
      if (!choice) return;
      formData.set("nicknameId", choice.nicknameId ?? "");
    }
    setPending(true);
    // 방 입장이 성공하면 서버가 그 방으로 이동시킨다(redirect).
    const result = kind === "room" ? await joinRoomByCode(null, formData) : await joinChallengeByCode(null, formData);
    setPending(false);
    if (result && "error" in result) {
      setError(result.error);
      return;
    }
    if (kind === "duel") router.push("/compete");
  };

  const title = kind === "room" ? t("roomTitle") : t("duelTitle");
  const invalid = loggedIn && !info;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {kind === "room" ? t("roomIntro") : t("duelIntro")}
      </p>

      {invalid ? (
        <>
          <p className="text-sm text-red-500">{t("invalid")}</p>
          <Link
            href={kind === "room" ? "/main" : "/compete"}
            className="rounded-md bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-700"
          >
            {kind === "room" ? t("goMain") : t("goCompete")}
          </Link>
        </>
      ) : (
        <>
          {info && (
            <div className="w-full rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-700">
              <p className="font-medium text-neutral-900 dark:text-white">
                {kind === "room" ? t("foundRoom", { name: info.name }) : t("foundDuel", { name: info.name })}
              </p>
              {info.memberCount !== null && (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t("memberCount", { count: info.memberCount })}
                </p>
              )}
            </div>
          )}
          {!loggedIn && <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("guestBody")}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="button"
            onClick={join}
            disabled={pending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {pending ? t("joining") : !loggedIn ? t("loginButton") : kind === "room" ? t("join") : t("joinDuel")}
          </button>
        </>
      )}
      {chooser.element}
    </div>
  );
}
