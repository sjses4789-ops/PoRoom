"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { NicknamePicker } from "@/components/nickname-picker";
import { setRoomNickname, type NicknameItem } from "@/lib/nicknames";

// 방 안에서 이 방의 닉네임을 바꾸는 버튼 + 안내창. 정상적으로는 방에 입장하기 전에 닉네임을 고르지만
// (use-nickname-chooser), 선택 없이 입장한 경우(모바일 앱 등)에는 nicknameSet=false라서 입장 직후
// 닫을 수 없는 안내창이 자동으로 뜬다.
export function RoomNickname({
  roomId,
  defaultName,
  currentNickname,
  nicknameSet,
  initialNicknames,
}: {
  roomId: string;
  defaultName: string;
  currentNickname: string | null;
  nicknameSet: boolean;
  initialNicknames: NicknameItem[];
}) {
  const t = useTranslations("room.nicknameDialog");
  const router = useRouter();
  const [open, setOpen] = useState(!nicknameSet);
  const [forced, setForced] = useState(!nicknameSet);
  const [current, setCurrent] = useState<string | null>(currentNickname);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("buttonTitle")}
        className="max-w-[10rem] truncate rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {t("buttonLabel", { name: current ?? defaultName })}
      </button>

      {open && (
        <NicknamePicker
          defaultName={defaultName}
          nicknames={initialNicknames}
          currentNickname={forced ? undefined : current}
          forced={forced}
          onClose={() => setOpen(false)}
          onSelect={async (nicknameId) => {
            const result = await setRoomNickname(roomId, nicknameId);
            if ("error" in result) return result.error;
            setCurrent(result.nickname);
            setOpen(false);
            setForced(false);
            router.refresh();
            return null;
          }}
        />
      )}
    </>
  );
}
