"use client";

import { useState } from "react";

type UsageItem = { icon: string; title: string; desc: string };

export function UsageGuideSection({ title, items }: { title: string; items: UsageItem[] }) {
  const [selected, setSelected] = useState(0);
  const active = items[selected] ?? items[0];

  return (
    <section className="border-t border-neutral-100 bg-neutral-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-center text-xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr]">
          <div className="flex flex-row flex-wrap gap-1.5 sm:flex-col sm:flex-nowrap">
            {items.map((item, i) => (
              <button
                key={item.title}
                onClick={() => setSelected(i)}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  selected === i
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.title}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="text-2xl" aria-hidden>
                {active.icon}
              </span>
              <h3 className="text-base font-semibold text-neutral-900">{active.title}</h3>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
              {active.desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
