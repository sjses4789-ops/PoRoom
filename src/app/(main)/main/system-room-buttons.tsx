"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { joinSystemRoom, type SystemRoomKind } from "@/lib/system-rooms";
import { useNicknameChooser } from "@/components/use-nickname-chooser";

const ROOM_META: Record<SystemRoomKind, { emoji: string; className: string }> = {
  deadline: {
    emoji: "🔥",
    className: "bg-[#a86363] hover:bg-[#966161] dark:bg-[#8f5555] dark:hover:bg-[#9c6060]",
  },
  dawn: {
    emoji: "🌛",
    className: "bg-[#5f6d97] hover:bg-[#556087] dark:bg-[#4f5c85] dark:hover:bg-[#5a6793]",
  },
};

export function SystemRoomButton({
  kind,
  count,
  capacity,
  isMember,
}: {
  kind: SystemRoomKind;
  count: number;
  capacity: number;
  // 이미 들어가 있는 방이면 닉네임을 다시 묻지 않고 바로 이동한다.
  isMember: boolean;
}) {
  const t = useTranslations("main.systemRooms");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const chooser = useNicknameChooser();
  const meta = ROOM_META[kind];
  const label = kind === "deadline" ? t("deadline") : t("dawn");
  const full = count >= capacity;

  const join = async () => {
    setError(null);
    // 처음 입장하는 방이면 입장하기 전에 이 방에서 쓸 닉네임부터 고른다.
    let nicknameId: string | null | undefined;
    if (!isMember) {
      const choice = await chooser.ask();
      if (!choice) return;
      nicknameId = choice.nicknameId;
    }
    setPending(true);
    const result = await joinSystemRoom(kind, nicknameId);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/room/${result.roomId}`);
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      <button
        onClick={join}
        disabled={pending}
        className={`flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${meta.className}`}
      >
        {pending ? t("entering") : t("enter", { emoji: meta.emoji, label })}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
            full ? "bg-red-500/80 text-white" : "bg-white/15 text-white"
          }`}
        >
          {count}/{capacity}
        </span>
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {chooser.element}
    </div>
  );
}
