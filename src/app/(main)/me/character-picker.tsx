"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { setCharacter } from "@/lib/profile";
import { CHARACTER_IDS, characterSrc } from "@/lib/characters";

export function CharacterPicker({
  initialCharacterId,
  onSelected,
}: {
  initialCharacterId: string | null;
  onSelected?: (id: string) => void;
}) {
  const t = useTranslations("me.characterPicker");
  const [selected, setSelected] = useState(initialCharacterId);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <div className="grid max-h-[34rem] grid-cols-3 gap-3 overflow-y-auto rounded-md border border-neutral-200 p-3 sm:grid-cols-4 dark:border-neutral-700">
        {CHARACTER_IDS.map((id) => {
          const isSelected = id === selected;
          return (
            <button
              key={id}
              type="button"
              disabled={pending}
              onClick={() => {
                setSelected(id);
                onSelected?.(id);
                startTransition(() => {
                  setCharacter(id);
                });
              }}
              className={`overflow-hidden rounded-md border-2 bg-neutral-50 transition dark:bg-neutral-800 ${
                isSelected
                  ? "border-neutral-900 dark:border-white"
                  : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-600"
              }`}
            >
              <Image
                src={characterSrc(id)!}
                alt=""
                width={480}
                height={360}
                className="h-auto w-full object-contain"
              />
            </button>
          );
        })}
      </div>
      <p className="text-[12px] text-neutral-400">
        {t("hint")}
      </p>
    </div>
  );
}
