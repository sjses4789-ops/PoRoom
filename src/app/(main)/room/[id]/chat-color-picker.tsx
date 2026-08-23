"use client";

import { useState } from "react";
import { PALETTE, paletteDot } from "@/lib/palette";
import { setChatColor } from "@/lib/profile";

export function ChatColorPicker({
  current,
  onChange,
}: {
  current: string | null;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="내 채팅 색상"
        className={`h-7 w-7 shrink-0 rounded-full border border-neutral-200 transition hover:opacity-80 ${
          current ? paletteDot(current) : "bg-neutral-200"
        }`}
      />
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/20"
          />
          <div className="fixed left-1/2 top-1/2 z-20 w-[min(18rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-md border border-neutral-300 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              내 채팅 색상
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={async () => {
                    onChange(p.key);
                    setOpen(false);
                    await setChatColor(p.key);
                  }}
                  title={p.label}
                  className={`h-6 w-6 rounded-full ${paletteDot(p.key)} transition ${
                    current === p.key
                      ? "ring-2 ring-neutral-900 ring-offset-2"
                      : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
