import { RANK_STYLE } from "@/lib/rank-style";

export type ChallengeRankingRow = {
  rank: number;
  userId: string;
  name: string;
  successCount: number;
};

export function ChallengeRanking({ rows }: { rows: ChallengeRankingRow[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center border-b border-neutral-100 pb-2">
        <span className="px-1 text-sm font-medium text-neutral-900 dark:text-white">
          챌린지 랭킹
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-neutral-400">
          매일 5천자·매일 1만자·초단 완고 성공 기록이 아직 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[240px] text-left text-sm">
            <thead>
              <tr className="text-xs text-neutral-400">
                <th className="w-14 py-2 font-medium">순위</th>
                <th className="py-2 font-medium">이름</th>
                <th className="py-2 text-right font-medium">성공</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const style = RANK_STYLE[r.rank];
                return (
                  <tr
                    key={r.userId}
                    className={`border-t border-neutral-100 ${style?.row ?? ""}`}
                  >
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 ${style?.rankText ?? "text-neutral-500"}`}
                      >
                        {style?.icon && <span aria-hidden>{style.icon}</span>}
                        {r.rank}
                      </span>
                    </td>
                    <td className={`py-2.5 font-medium ${style?.nameText ?? "text-neutral-900 dark:text-white"}`}>
                      {r.name}
                    </td>
                    <td className="py-2.5 text-right text-neutral-600 dark:text-neutral-300">
                      {r.successCount}회
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
