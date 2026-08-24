import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import NavTabs from "./nav-tabs";
import LogoutButton from "./logout-button";
import { SiteFooter } from "./site-footer";
import { PomodoroProvider } from "./pomodoro-context";
import { PomodoroMiniWidget } from "./pomodoro-mini-widget";
import { SiteTimeTracker } from "./site-time-tracker";
import { TimezoneSync } from "./timezone-sync";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const t = await getTranslations("layout");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle<{ name: string | null }>();

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
            <span className="hidden shrink-0 whitespace-nowrap text-xs text-neutral-400 sm:inline dark:text-neutral-500">
              {t("writingAppHint")}
            </span>
            <a
              href="https://pomowriter.oopy.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:bg-stone-200"
            >
              PomoWriter
            </a>
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
          <span className="shrink-0 whitespace-nowrap text-xs text-neutral-400 dark:text-neutral-500">
            {t("writingAppHint")}
          </span>
          <a
            href="https://pomowriter.oopy.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:bg-stone-200"
          >
            PomoWriter
          </a>
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
