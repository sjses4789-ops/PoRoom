import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name,is_banned,is_premium")
    .eq("id", user.id)
    .maybeSingle<{ name: string | null; is_banned: boolean; is_premium: boolean }>();

  // 서비스 키 없이 관리자 플래그(users.is_banned)만으로 계정을 막는
  // 방식이라, 매 요청마다 여기서 확인해서 걸리면 세션을 끊는다 —
  // 그래야 다시 로그인해도 곧바로 다시 튕겨나간다.
  if (profile?.is_banned) {
    await supabase.auth.signOut();
    redirect("/login?banned=1");
  }

  if (!profile?.name) {
    redirect("/onboarding");
  }

  return (
    <PomodoroProvider>
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <header className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-4 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-4 md:justify-start md:gap-8">
          <Link href="/main" className="flex shrink-0 items-center gap-2">
            <Image src="/poroom-icon.png" alt="" width={24} height={24} />
            <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              PoRoom
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 md:hidden">
            <TierBadgeButton isPremium={profile.is_premium} />
            <Link href="/me" className="max-w-[100px] truncate hover:underline">
            {profile.name}
          </Link>
            <LogoutButton />
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:flex-1 md:px-0">
          <NavTabs />
        </div>
        <div className="hidden items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 md:flex">
          <TierBadgeButton isPremium={profile.is_premium} />
          <Link href="/me" className="max-w-[160px] truncate hover:underline">
            {profile.name}
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</main>
      <SiteFooter />
      <PomodoroMiniWidget />
      <SiteTimeTracker />
      <TimezoneSync />
    </div>
    </PomodoroProvider>
  );
}
