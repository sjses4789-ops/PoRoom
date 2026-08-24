import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./locales";

// 메시지 파일을 네임스페이스별로(common/nav/main/...) 쪼개둔 이유는, 각
// 페이지 트리를 서로 다른 작업 단위(에이전트)가 독립적으로 번역·추가할
// 때 같은 파일을 동시에 건드리지 않도록 하기 위함 — 새 네임스페이스를
// 추가하면 여기 목록에도 추가해야 한다.
const NAMESPACES = [
  "common",
  "nav",
  "layout",
  "login",
  "onboarding",
  "main",
  "compete",
  "ranking",
  "me",
  "room",
  "tags",
  "admin",
] as const;

// URL은 그대로 두고(경로에 언어를 넣지 않음) 쿠키로만 언어를 구분한다 —
// 상단 언어 선택기가 이 쿠키를 바꾸고 router.refresh()로 서버 컴포넌트를
// 다시 렌더시키는 방식.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      try {
        const mod = await import(`../../messages/${locale}/${ns}.json`);
        return [ns, mod.default] as const;
      } catch {
        return [ns, {}] as const;
      }
    })
  );

  return {
    locale,
    messages: Object.fromEntries(entries),
  };
});
