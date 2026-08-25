"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { setWorkStatus } from "@/lib/rooms";
import { POMODORO_STORAGE_KEY, usePomodoroContext } from "./pomodoro-context";

export default function LogoutButton() {
  const router = useRouter();
  const t = useTranslations("layout");
  const { flushPending } = usePomodoroContext();

  const handleLogout = async () => {
    // 로그아웃은 뽀모도로 진행 상황과 상태 설정을 리셋한다 — 로그인을
    // 유지한 채 새로고침하거나 다른 페이지를 오가는 경우는 그대로
    // 유지되어야 하므로, 리셋은 로그아웃 시점에만 여기서 처리한다.
    // work_status는 계정(users)에 저장되니 로그아웃 전(=인증된 상태)에
    // 지워야 하고, 뽀모도로는 localStorage 스냅샷을 지우면 다음 로그인 때
    // PomodoroProvider가 빈 상태로 새로 시작한다. flushPending으로 아직
    // 분 단위로 채워지지 않은 진행 중인 초까지 먼저 서버에 반영해둔다.
    flushPending();
    await setWorkStatus(null);
    window.localStorage.removeItem(POMODORO_STORAGE_KEY);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {t("logout")}
    </button>
  );
}
