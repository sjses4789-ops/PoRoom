"use client";

import { useActionState, useState } from "react";
import { createRoom, type ActionResult } from "@/lib/rooms";
import { PALETTE, paletteDot } from "@/lib/palette";
import { ROOM_TAGS } from "@/lib/room-tags";

const RECORD_VISIBILITY_OPTIONS = [
  { value: "shared", label: "기록 공유방", hint: "모두의 기록이 공개돼요" },
  { value: "private", label: "기록 비공유방", hint: "서로의 기록이 비공개예요" },
  { value: "free", label: "기록 공유 자유", hint: "각자 공개 여부를 정해요" },
] as const;

const JOIN_TYPE_OPTIONS = [
  { value: "invite", label: "초대코드 입장" },
  { value: "open", label: "공개방" },
] as const;

export default function CreateRoomButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const [color, setColor] = useState<string>(PALETTE[0].key);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const toggleTag = (tag: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createRoom,
    null
  );

  return (
    <>
      <button
        onClick={onToggle}
        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        새 방 만들기
      </button>
      {open && (
        <>
          <div onClick={onToggle} className="fixed inset-0 z-10 bg-neutral-900/20" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-20 flex max-h-[85vh] w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-md border border-neutral-300 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
          <form action={formAction} className="flex flex-col gap-3">
            <input
              name="name"
              placeholder="방 이름"
              className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                방 색상
              </span>
              <input type="hidden" name="color" value={color} />
              <div className="flex flex-wrap gap-1.5">
                {PALETTE.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setColor(p.key)}
                    title={p.label}
                    className={`h-6 w-6 rounded-full ${paletteDot(p.key)} transition ${
                      color === p.key
                        ? "ring-2 ring-neutral-900 ring-offset-2"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                태그
              </span>
              {Array.from(tags).map((t) => (
                <input key={t} type="hidden" name="tags" value={t} />
              ))}
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {ROOM_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-2 py-0.5 text-[12px] transition ${
                      tags.has(tag)
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                입장 방식
              </span>
              <div className="flex gap-3">
                {JOIN_TYPE_OPTIONS.map((opt, i) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                  >
                    <input
                      type="radio"
                      name="joinType"
                      value={opt.value}
                      defaultChecked={i === 0}
                      className="accent-neutral-900"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                기록 공개 정책
              </span>
              <div className="flex flex-col gap-1">
                {RECORD_VISIBILITY_OPTIONS.map((opt, i) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                  >
                    <input
                      type="radio"
                      name="recordVisibility"
                      value={opt.value}
                      defaultChecked={i === 0}
                      className="accent-neutral-900"
                    />
                    {opt.label}
                    <span className="text-neutral-400">{opt.hint}</span>
                  </label>
                ))}
              </div>
            </div>

            {state?.error && (
              <p className="text-xs text-red-500">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {pending ? "만드는 중..." : "만들기"}
            </button>
          </form>
          </div>
        </>
      )}
    </>
  );
}
