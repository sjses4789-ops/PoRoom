import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ADSENSE_REVIEW_MODE, TIER_BADGE_VISIBLE } from "@/lib/adsense-review-mode";
import { isAppRequest } from "@/lib/app-mode";
import NavTabs from "./nav-tabs";
import LogoutButton from "./logout-button";
import { SiteFooter } from "./site-footer";
import { PomodoroProvider } from "./pomodoro-context";
import { PomodoroMiniWidget } from "./pomodoro-mini-widget";
import { SiteTimeTracker } from "./site-time-tracker";
import { TimezoneSync } from "./timezone-sync";
import { TierBadgeButton } from "./tier-badge-button";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const tLogin = await getTranslations("login");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ADSENSE_REVIEW_MODE 동안은 비로그인 방문자도 이 레이아웃을 그대로
  // 통과시킨다(아래에서 profile이 없는 게스트로 렌더링됨) — 심사가
  // 끝나면 이 값을 false로 돌려서 원래대로(로그인 필수) 복구한다.
  if (!user && !ADSENSE_REVIEW_MODE) {
    redirect("/login");
  }

  // 모바일 앱(WebView)에서는 하단 탭 바가 네비게이션을 대신하므로 웹의 상단
  // 헤더와 푸터를 숨긴다.
  const inApp = await isAppRequest();

  const { data: profile } = user
    ? await supabase
        .from("users")
        .select("name,is_banned,is_premium,position")
        .eq("id", user.id)
        .maybeSingle<{
          name: string | null;
          is_banned: boolean;
          is_premium: boolean;
          position: string | null;
        }>()
    : { data: null };

  if (user) {
    // 서비스 키 없이 관리자 플래그(users.is_banned)만으로 계정을 막는
    // 방식이라, 매 요청마다 여기서 확인해서 걸리면 세션을 끊는다 —
    // 그래야 다시 로그인해도 곧바로 다시 튕겨나간다.
    if (profile?.is_banned) {
      await supabase.auth.signOut();
      redirect("/login?banned=1");
    }

    // 기존 사용자는 마이그레이션에서 position이 이미 채워져 있으니
    // 여기 걸리지 않는다 — 닉네임과 직업을 아직 안 고른(=처음 가입한)
    // 사용자만 온보딩으로 보낸다.
    if (!profile?.name || !profile?.position) {
      redirect("/onboarding");
    }
  }

  return (
    <PomodoroProvider>
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      {!inApp && (
      <header className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-4 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-4 md:justify-start md:gap-8">
          <div className="flex shrink-0 flex-col items-start gap-0.5">
            <Link href="/main" className="flex items-center gap-2">
              <Image src="/poroom-icon.png" alt="" width={24} height={24} />
              <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                PoRoom
              </span>
            </Link>
            {/* 베타 서비스 표시 — 마우스를 올리면 안내 문구가 보인다(홈페이지의 BETA 배지와 같은 모양). */}
            <span
              title={tLogin("landing.betaNotice")}
              className="cursor-default rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold leading-none tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            >
              BETA
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 md:hidden">
            {profile ? (
              <>
                {TIER_BADGE_VISIBLE && <TierBadgeButton isPremium={profile.is_premium} />}
                <Link
                  href="/me"
                  className="max-w-[100px] truncate font-bold text-neutral-900 hover:underline dark:text-white"
                >
                  {profile.name}
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="font-bold text-neutral-900 hover:underline dark:text-white"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:flex-1 md:px-0">
          <NavTabs />
        </div>
        <div className="hidden items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 md:flex">
          {profile ? (
            <>
              {TIER_BADGE_VISIBLE && <TierBadgeButton isPremium={profile.is_premium} />}
              <Link
                href="/me"
                className="max-w-[160px] truncate font-bold text-neutral-900 hover:underline dark:text-white"
              >
                {profile.name}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="font-bold text-neutral-900 hover:underline dark:text-white"
            >
              로그인
            </Link>
          )}
        </div>
      </header>
      )}
      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</main>
      {!inApp && <SiteFooter />}
      <PomodoroMiniWidget />
      <SiteTimeTracker />
      <TimezoneSync />
    </div>
    </PomodoroProvider>
  );
}
