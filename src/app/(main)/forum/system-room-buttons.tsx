"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinSystemRoom, type SystemRoomKind } from "@/lib/system-rooms";

const ROOM_META: Record<
  SystemRoomKind,
  { label: string; emoji: string; className: string }
> = {
  deadline: {
    label: "마감방",
    emoji: "🔥",
    className: "bg-[#a86363] hover:bg-[#966161] dark:bg-[#8f5555] dark:hover:bg-[#9c6060]",
  },
  dawn: {
    label: "새벽방",
    emoji: "🌛",
    className: "bg-[#5f6d97] hover:bg-[#556087] dark:bg-[#4f5c85] dark:hover:bg-[#5a6793]",
  },
};

export function SystemRoomButton({
  kind,
  count,
  capacity,
}: {
  kind: SystemRoomKind;
  count: number;
  capacity: number;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const meta = ROOM_META[kind];
  const full = count >= capacity;

  const join = async () => {
    setPending(true);
    setError(null);
    const result = await joinSystemRoom(kind);
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
        {pending ? "입장 중..." : `${meta.emoji} ${meta.label} 입장`}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
            full ? "bg-red-500/80 text-white" : "bg-white/15 text-white"
          }`}
        >
          {count}/{capacity}
        </span>
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
