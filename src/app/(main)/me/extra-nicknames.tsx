"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createNickname, updateNickname, type NicknameItem } from "@/lib/nicknames";
import { MAX_EXTRA_NICKNAMES, MAX_NICKNAME_LENGTH } from "@/lib/nickname-limits";

// [개인] 페이지 "닉네임" 영역 아래의 닉네임 목록. 기본 닉네임(가입할 때 정한 닉네임, 위 입력칸에서
// 바꾼다) 1개와, 방별로 골라 쓰는 추가 닉네임 최대 2개(합쳐서 3개)를 한눈에 보여 주고 추가 닉네임은
// 여기서 만들고 고칠 수 있다.
export function ExtraNicknames({
  defaultName,
  initialNicknames,
}: {
  defaultName: string;
  initialNicknames: NicknameItem[];
}) {
  const t = useTranslations("me.extraNicknames");
  const [items, setItems] = useState(initialNicknames);

  const slots: (NicknameItem | null)[] = Array.from({ length: MAX_EXTRA_NICKNAMES }, (_, i) => items[i] ?? null);

  return (
    <div className="mt-4 flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-neutral-500">{t("heading")}</h4>
      <p className="text-[12px] text-neutral-400">{t("hint", { max: MAX_EXTRA_NICKNAMES + 1 })}</p>
      <ul className="flex max-w-xs flex-col gap-2">
        <li className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700">
          <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {t("defaultBadge")}
          </span>
          <span className="min-w-0 truncate text-neutral-900 dark:text-white">{defaultName}</span>
        </li>
        {slots.map((item, i) => (
          <NicknameSlot
            key={item?.id ?? `empty-${i}`}
            item={item}
            onSaved={(saved) =>
              setItems((prev) =>
                item ? prev.map((n) => (n.id === saved.id ? saved : n)) : [...prev, saved]
              )
            }
          />
        ))}
      </ul>
    </div>
  );
}

function NicknameSlot({
  item,
  onSaved,
}: {
  item: NicknameItem | null;
  onSaved: (saved: NicknameItem) => void;
}) {
  const t = useTranslations("me.extraNicknames");
  const [value, setValue] = useState(item?.nickname ?? "");
  const [saved, setSaved] = useState(item?.nickname ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = value.trim() !== saved && value.trim() !== "";

  const save = async () => {
    if (!changed) return;
    setPending(true);
    setError(null);
    const result = item ? await updateNickname(item.id, value) : await createNickname(value);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setValue(result.nickname);
    setSaved(result.nickname);
    onSaved({ id: result.id, nickname: result.nickname });
  };

  return (
    <li className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          maxLength={MAX_NICKNAME_LENGTH}
          placeholder={item ? t("editPlaceholder") : t("emptyPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || !changed}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {pending ? t("saving") : item ? t("save") : t("create")}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </li>
  );
}
