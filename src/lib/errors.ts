import { getTranslations } from "next-intl/server";
import type { RelativeTimeLabels } from "@/lib/time";

// 서버 액션이 사용자에게 돌려주는 오류 문구를 현재 언어로 만든다(messages/<언어>/errors.json).
// "use server" 파일이 아니라서 이 함수를 서버 액션 안에서 자유롭게 불러 쓸 수 있다.
export async function err(key: string, values?: Record<string, string | number>): Promise<string> {
  const t = await getTranslations("errors");
  return t(key as never, values as never);
}

// "방금 전 / n분 전 / n시간 전" 문구를 현재 언어로 만든다(formatRelativeTime에 넘긴다).
export async function getRelativeTimeLabels(): Promise<RelativeTimeLabels> {
  const t = await getTranslations("errors.relativeTime");
  return {
    justNow: t("justNow"),
    minutesAgo: (n) => t("minutesAgo", { count: n }),
    hoursAgo: (n) => t("hoursAgo", { count: n }),
  };
}
