import { AdSlot } from "./ad-slot";

// 포룸/대결/랭킹/개인 페이지 콘텐츠 폭을 줄이고, 남는 오른쪽 여백에 세로형
// 광고를 넣을 수 있도록 하는 공용 레이아웃. 좁은 화면에서는 광고가
// 본문을 밀어내지 않도록 xl 이상에서만 보여준다.
export function PageAdRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl gap-6">
      <div className="min-w-0 flex-1">{children}</div>
      <aside className="hidden shrink-0 xl:block">
        <div className="sticky top-6 w-[160px]">
          <AdSlot variant="vertical" className="h-[600px] w-[160px] rounded-lg border border-neutral-100 dark:border-neutral-800" />
        </div>
      </aside>
    </div>
  );
}
