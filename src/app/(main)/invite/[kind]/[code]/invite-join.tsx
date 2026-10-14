"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { joinRoomByCode } from "@/lib/rooms";
import { joinChallengeByCode } from "@/lib/challenges";
import { useLoginGate } from "@/components/login-gate";
import { useNicknameChooser } from "@/components/use-nickname-chooser";

// 초대를 받는 중이라는 표시 쿠키 — onboarding/page.tsx도 같은 이름을 읽는다.
const INVITE_COOKIE = "poroom-invite";

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
    // 로그인/가입을 끝내고 돌아왔을 때 자동 입장하도록 "이 초대를 받는 중"이라는 표시를 하루 동안 남긴다.
    document.cookie = `${INVITE_COOKIE}=${kind}:${code}; path=/; max-age=86400; samesite=lax`;
    gate.requireLogin();
  }, [loggedIn, gate, kind, code]);

  const join = async (auto = false) => {
    if (!gate.requireLogin()) return;
    setError(null);
    const formData = new FormData();
    formData.set("code", code);
    if (kind === "room") {
      if (auto) {
        // 자동 입장은 기본 닉네임으로 들어간다(방 안의 닉네임 버튼으로 나중에 바꿀 수 있다).
        formData.set("nicknameId", "");
      } else {
        // 입장하기 전에 이 방에서 쓸 닉네임부터 고른다.
        const choice = await chooser.ask();
        if (!choice) return;
        formData.set("nicknameId", choice.nicknameId ?? "");
      }
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

  // 가입/로그인을 마치고 이 페이지로 돌아오면 자동으로 입장한다 — 비로그인으로 이 링크를 열 때 심어 둔 쿠키가 신호다.
  // (처음 가입한 사람은 온보딩이 끝난 뒤 이 페이지로 돌아온다 — onboarding/page.tsx)
  const autoRef = useRef(false);
  useEffect(() => {
    if (!loggedIn || !info || autoRef.current) return;
    if (!document.cookie.split("; ").some((c) => c === `${INVITE_COOKIE}=${kind}:${code}`)) return;
    autoRef.current = true;
    document.cookie = `${INVITE_COOKIE}=; path=/; max-age=0`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void join(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, info, kind, code]);

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
            onClick={() => void join()}
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
