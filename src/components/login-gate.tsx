"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GoogleSignInButton } from "./google-sign-in-button";

type LoginGate = {
  isGuest: boolean;
  // 로그인돼 있으면 true. 아니면 로그인 안내 팝업을 띄우고 false — 로그인이 필요한 동작 맨 앞에서 부른다.
  requireLogin: () => boolean;
};

const LoginGateContext = createContext<LoginGate>({ isGuest: false, requireLogin: () => true });

export function useLoginGate() {
  return useContext(LoginGateContext);
}

// 비로그인(보기 전용) 방문자가 방 입장·글쓰기·반응·참여 같은 동작을 하려 할 때, 구글 계정 로그인으로 이끄는 팝업.
export function LoginGateProvider({ isGuest, children }: { isGuest: boolean; children: React.ReactNode }) {
  const t = useTranslations("layout.loginGate");
  const [open, setOpen] = useState(false);

  const requireLogin = useCallback(() => {
    if (!isGuest) return true;
    setOpen(true);
    return false;
  }, [isGuest]);

  const value = useMemo(() => ({ isGuest, requireLogin }), [isGuest, requireLogin]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <LoginGateContext.Provider value={value}>
      {children}
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-[80] bg-neutral-900/50" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-gate-title"
            className="fixed left-1/2 top-1/2 z-[85] flex w-[min(22rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-lg border border-neutral-300 bg-white p-6 text-center shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
          >
            <p id="login-gate-title" className="text-base font-semibold text-neutral-900 dark:text-white">
              {t("title")}
            </p>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{t("body")}</p>
            <GoogleSignInButton
              label={t("google")}
              next={typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-neutral-400 transition hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
            >
              {t("close")}
            </button>
          </div>
        </>
      )}
    </LoginGateContext.Provider>
  );
}
