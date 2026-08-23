import { AttendanceCalendar } from "../me/attendance-calendar";
import GoalBar from "../me/goal-bar";
import { TodoList, type Todo } from "@/components/todo-list";

export function ForumDashboard({
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
  const percentile =
    totalUsers > 0 ? Math.max(1, Math.round((overallRank / totalUsers) * 100)) : null;

  return (
    <section className="flex h-full flex-col gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">내 현황</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">할 일</span>
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
              오늘의 글자수
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
              이번 달 목표 글자수
            </span>
            {monthGoalChars > 0 ? (
              <GoalBar
                label="글자수"
                current={monthProgressChars}
                target={monthGoalChars}
                unit="자"
              />
            ) : (
              <p className="text-[12px] text-neutral-400">
                [개인] 페이지에서 이번 달 목표를 설정해보세요.
              </p>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-neutral-50 px-3 py-2.5 text-center dark:bg-neutral-800">
            <span className="text-[12px] text-neutral-500 dark:text-neutral-400">개인 랭킹 (이번 달)</span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              전체 {overallRank}위 / {totalUsers}명
            </span>
            {percentile !== null && (
              <span className="text-[12px] text-neutral-400 dark:text-neutral-500">
                (상위 {percentile}%)
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
