import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthLanding } from "@/components/auth-landing";

// 로그인 안 한 방문자(구글 애드센스 크롤러 포함)도 리다이렉트 없이 바로
// 이 페이지에서 콘텐츠(및 <head>의 애드센스 스크립트)를 받아야 하므로,
// 미들웨어가 "/"는 로그인 여부와 무관하게 그대로 통과시키고 이 페이지가
// 직접 분기한다.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/main");
  }

  return <AuthLanding />;
}
