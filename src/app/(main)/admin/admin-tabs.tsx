"use client";

import { useState, type ReactNode } from "react";

export type AdminTab = { key: string; label: string; badge?: number; content: ReactNode };

// 관리자 페이지의 항목을 탭으로 묶어 보여 준다. 내용은 서버에서 그려 넘겨받고, 선택되지 않은 탭도
// 그대로 두고 숨기기만 해서(펼친 글/입력 중인 값이 유지된다) 탭을 오가도 상태가 사라지지 않는다.
export function AdminTabs({ tabs }: { tabs: AdminTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`admin-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`admin-panel-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm transition ${
                selected
                  ? "border-neutral-900 font-semibold text-neutral-900 dark:border-white dark:text-white"
                  : "border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              {tab.label}
              {!!tab.badge && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400 px-1 text-[10px] font-bold leading-none text-white">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`admin-panel-${tab.key}`}
          aria-labelledby={`admin-tab-${tab.key}`}
          hidden={tab.key !== active}
          className={tab.key === active ? "flex flex-col gap-10" : "hidden"}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
