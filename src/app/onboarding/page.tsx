import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { NicknameForm } from "@/components/nickname-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const t = await getTranslations("onboarding");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle<{ name: string | null }>();

  if (profile?.name) redirect("/main");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="max-w-xs text-sm text-neutral-500">{t("description")}</p>
      </div>
      <NicknameForm redirectTo="/main" submitLabel={t("start")} />
    </main>
  );
}
