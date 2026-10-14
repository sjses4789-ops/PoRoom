import type { createClient } from "@/lib/supabase/server";
import { computeStreakDays } from "@/lib/attendance";
import { kstDatePlusDays, todayKst } from "@/lib/time";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type WeeklyReport = {
  /** 그 주의 월요일(KST, YYYY-MM-DD). 알림의 중복 방지 키로도 쓴다. */
  weekStart: string;
  weekEnd: string;
  chars: number;
  focusMinutes: number;
  /** 기록을 남긴 날 수(0~7). */
  activeDays: number;
  /** 지금까지 이어진 연속 집필 일수. */
  streak: number;
};

function mondayOf(dateKst: string): string {
  const [y, m, d] = dateKst.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=일
  return kstDatePlusDays(-((dow + 6) % 7), dateKst);
}

// 지난주(월~일, 한국 시간)의 집필 요약. 기록이 하나도 없는 주는 null — 빈 리포트는 알림으로 만들지 않는다.
export async function getLastWeekReport(supabase: Supabase, userId: string): Promise<WeeklyReport | null> {
  const today = todayKst();
  const thisMonday = mondayOf(today);
  const weekStart = kstDatePlusDays(-7, thisMonday);
  const weekEnd = kstDatePlusDays(-1, thisMonday);

  const { data } = await supabase
    .from("daily_records")
    .select("record_date,chars,focus_minutes")
    .eq("user_id", userId)
    .gte("record_date", kstDatePlusDays(-90, today))
    .returns<{ record_date: string; chars: number; focus_minutes: number }[]>();
  const rows = data ?? [];

  const inWeek = rows.filter((r) => r.record_date >= weekStart && r.record_date <= weekEnd);
  const chars = inWeek.reduce((s, r) => s + r.chars, 0);
  const focusMinutes = inWeek.reduce((s, r) => s + r.focus_minutes, 0);
  const activeDates = new Set(inWeek.filter((r) => r.chars > 0 || r.focus_minutes > 0).map((r) => r.record_date));
  if (activeDates.size === 0) return null;

  const attended = new Set(rows.filter((r) => r.chars > 0 || r.focus_minutes > 0).map((r) => r.record_date));
  return {
    weekStart,
    weekEnd,
    chars,
    focusMinutes,
    activeDays: activeDates.size,
    streak: computeStreakDays(attended, today),
  };
}
