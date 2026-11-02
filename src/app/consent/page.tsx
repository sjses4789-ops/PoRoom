import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ConsentForm } from "./consent-form";

// 이미 가입한 회원이 나이 확인·약관 동의를 처음 한 번 하는 화면 — (main) 레이아웃이 동의 기록이 없는 회원을 여기로 보낸다.
export default async function ConsentPage() {
  const supabase = await createClient();
  const t = await getTranslations("onboarding");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 이미 동의했다면 붙잡지 않는다(열이 없으면 오류가 나므로 그것도 통과).
  const { data, error } = await supabase
    .from("users")
    .select("terms_agreed_at")
    .eq("id", user.id)
    .maybeSingle<{ terms_agreed_at: string | null }>();
  if (error || data?.terms_agreed_at) redirect("/main");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 py-10 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">{t("consentTitle")}</h1>
        <p className="max-w-xs text-sm text-neutral-500">{t("consentDescription")}</p>
      </div>
      <ConsentForm />
    </main>
  );
}
