import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const t = await getTranslations("onboarding");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name,character_id,position")
    .eq("id", user.id)
    .maybeSingle<{ name: string | null; character_id: string | null; position: string | null }>();

  // 닉네임과 직업을 둘 다 이미 골랐다면(=온보딩을 완전히 마쳤다면) 다시
  // 붙잡지 않는다. 기존 사용자는 마이그레이션에서 position이 이미
  // 'novelist'로 채워져 있어 여기 걸리지 않는다 — 새로 가입한 사용자만
  // position이 NULL이라 이 화면을 보게 된다.
  if (profile?.name && profile?.position) redirect("/main");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 py-10 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="max-w-xs text-sm text-neutral-500">{t("description")}</p>
      </div>
      <OnboardingForm
        defaultNickname={profile?.name ?? ""}
        initialCharacterId={profile?.character_id ?? null}
      />
    </main>
  );
}
