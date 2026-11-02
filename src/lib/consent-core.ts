import { err } from "@/lib/errors";
import type { createClient } from "@/lib/supabase/server";
import { performAccountDeletion } from "@/lib/account-core";
import { todayKst } from "@/lib/time";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// 가입 최소 나이(만). 개인정보처리방침·이용약관과 같은 값이다.
export const MIN_AGE = 14;
const MAX_AGE = 120;

// YYYY-MM-DD 생년월일 → 만 나이(한국 날짜 기준). 형식이 틀렸거나 미래 날짜면 null.
export function ageFromBirthDate(birthDate: string, today = todayKst()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  if (birthDate > today) return null;
  const [ty, tmo, td] = today.split("-").map(Number);
  let age = ty - y;
  if (tmo < mo || (tmo === mo && td < d)) age -= 1;
  return age;
}

export type ConsentResult = { ok: true } | { error: string } | { underage: true };

// 가입(온보딩)·기존 회원의 첫 확인에서 나이와 약관 동의를 확인하고 저장한다.
//  - 만 14세 미만이면 저장하지 않고 계정을 곧바로 완전히 지운다(방침: 수집된 정보는 지체 없이 삭제).
//  - 생년월일 전체는 저장하지 않고 출생 연도만 둔다.
//  - users 테이블에 새 열(0076)이 아직 없으면 저장은 건너뛰고 통과시킨다(SQL 실행 전에도 가입이 막히지 않게).
export async function recordConsent(
  supabase: Supabase,
  userId: string,
  birthDate: string,
  agreeTerms: boolean
): Promise<ConsentResult> {
  if (!birthDate) return { error: await err("birthDateRequired") };
  const age = ageFromBirthDate(birthDate);
  if (age === null || age > MAX_AGE) return { error: await err("birthDateInvalid") };
  if (age < MIN_AGE) {
    await performAccountDeletion(supabase, userId);
    await supabase.auth.signOut();
    return { underage: true };
  }
  if (!agreeTerms) return { error: await err("termsRequired") };

  const { error } = await supabase
    .from("users")
    .update({ birth_year: Number(birthDate.slice(0, 4)), terms_agreed_at: new Date().toISOString() })
    .eq("id", userId);
  // 42703 = 열이 없음(0076 미실행) — 저장은 못 하지만 가입은 진행시킨다.
  if (error && error.code !== "42703") return { error: error.message };
  return { ok: true };
}
