import { getTranslations } from "next-intl/server";
import { AttendanceCalendar } from "../me/attendance-calendar";
import GoalBar from "../me/goal-bar";
import { TodoList, type Todo } from "@/components/todo-list";

export async function MainDashboard({
  todayChars,
  year,
  month,
  attendedDates,
  streakDays,
  monthGoalChars,
  monthProgressChars,
  initialTodos,
  overallRank,
  totalUsers,
}: {
  todayChars: number;
  year: number;
  month: number;
  attendedDates: Set<string>;
  streakDays: number;
  monthGoalChars: number;
  monthProgressChars: number;
  initialTodos: Todo[];
  overallRank: number;
  totalUsers: number;
}) {
  const t = await getTranslations("main.dashboard");
  const percentile =
    totalUsers > 0 ? Math.max(1, Math.round((overallRank / totalUsers) * 100)) : null;

  return (
    <section className="flex h-full flex-col gap-4 border border-neutral-400 p-4 dark:border-neutral-600">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">{t("todo")}</span>
          <TodoList initialTodos={initialTodos} />
        </div>
        <AttendanceCalendar
          year={year}
          month={month}
          attendedDates={attendedDates}
          streakDays={streakDays}
        />
        <div className="flex flex-col justify-center gap-3">
          <div className="flex flex-col items-center gap-1 rounded-md bg-neutral-50 py-3 dark:bg-neutral-800">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              {todayChars.toLocaleString()}
            </span>
            <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
              {t("todayChars")}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
              {t("monthGoal")}
            </span>
            {monthGoalChars > 0 ? (
              <GoalBar
                label={t("goalLabel")}
                current={monthProgressChars}
                target={monthGoalChars}
                unit={t("goalUnit")}
              />
            ) : (
              <p className="text-[12px] text-neutral-400">{t("setGoalHint")}</p>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-neutral-50 px-3 py-2.5 text-center dark:bg-neutral-800">
            <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
              {t("monthlyRank")}
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t("rankLine", { rank: overallRank, total: totalUsers })}
            </span>
            {percentile !== null && (
              <span className="text-[12px] text-neutral-400 dark:text-neutral-500">
                {t("percentile", { percent: percentile })}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
