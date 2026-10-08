import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, GUIDE_CATEGORIES, GUIDE_UPDATED_AT, guideReadMinutes } from "@/content/guides";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "작가 가이드",
  description:
    "웹소설·웹툰 작가를 위한 실용 가이드 모음. 뽀모도로 집필 습관, 1화 구성, 대사와 묘사, 웹툰 콘티와 연출, 작업 환경, 공모전·투고 준비까지 다룹니다.",
  alternates: { canonical: `${SITE_URL}/guide` },
};

export default function GuideIndexPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">작가 가이드</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          웹소설과 웹툰을 연재하거나 준비하는 작가가 실제 작업에서 바로 써 볼 수 있도록 정리한 글 모음입니다. 집필
          습관과 작법, 웹툰 작업 방법, 몸과 작업 환경 관리, 연재와 투고 준비를 다룹니다. 각 글은 단계별로 따라 해
          볼 수 있는 체크리스트와 예시를 담고 있으며, 필요한 부분만 골라 읽어도 됩니다.
        </p>
        <p className="text-xs text-neutral-400">
          총 {GUIDES.length}편 · 마지막 업데이트 {GUIDE_UPDATED_AT}
        </p>
      </header>

      {GUIDE_CATEGORIES.map((category) => {
        const items = GUIDES.filter((g) => g.category === category.name);
        if (items.length === 0) return null;
        return (
          <section key={category.name} className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{category.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">{category.description}</p>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guide/${guide.slug}`}
                    className="flex h-full flex-col gap-2 rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
                  >
                    <h3 className="text-[15px] font-medium leading-snug">{guide.title}</h3>
                    <p className="text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {guide.description}
                    </p>
                    <span className="mt-auto text-xs text-neutral-400">읽는 시간 약 {guideReadMinutes(guide)}분</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
