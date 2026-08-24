"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { characterSrc } from "@/lib/characters";
import { CharacterPicker } from "./character-picker";

export function CharacterSection({
  initialCharacterId,
}: {
  initialCharacterId: string | null;
}) {
  const t = useTranslations("me.characterSection");
  const [open, setOpen] = useState(false);
  const [characterId, setCharacterId] = useState(initialCharacterId);
  const src = characterSrc(characterId);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-md bg-neutral-50 dark:bg-neutral-800">
        {src ? (
          <Image
            src={src}
            alt=""
            width={480}
            height={360}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl text-neutral-300">🙂</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {t("changeCharacter")}
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/30"
          />
          <div className="fixed left-1/2 top-1/2 z-20 max-h-[90vh] w-[min(36rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-neutral-300 bg-white p-5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {t("changeCharacter")}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <CharacterPicker
              initialCharacterId={characterId}
              onSelected={(id) => {
                setCharacterId(id);
                setOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
