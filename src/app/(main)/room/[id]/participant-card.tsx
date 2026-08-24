import Image from "next/image";
import { useTranslations } from "next-intl";
import { PomodoroDonut } from "./pomodoro-donut";
import { WorkStatusPicker } from "./work-status-picker";
import type { Phase } from "./use-pomodoro";
import type { PresenceStatus } from "./use-room-presence";
import { characterSrc } from "@/lib/characters";
import { workStatusBg } from "@/lib/work-status-colors";

export type ParticipantData = {
  id: string;
  name: string;
  isSelf?: boolean;
  characterId: string | null;
  phase: Phase | "idle";
  focusMinutes: number;
  breakMinutes: number;
  elapsedFraction: number;
  accumulatedFocusMinutes: number;
  accumulatedChars: number;
  presence: PresenceStatus;
  recordsVisible: boolean;
  lastSeenLabel: string | null;
  workStatus: string | null;
};

const PHASE_COLOR: Record<ParticipantData["phase"], string> = {
  focus: "#c17b7b",
  break: "#7b93c1",
  idle: "#8a8a8a",
};

const PRESENCE_DOT: Record<PresenceStatus, string> = {
  offline: "bg-neutral-300",
  typing: "bg-emerald-500",
  idle: "bg-neutral-400",
};

export function ParticipantCard({
  data,
  onChangeWorkStatus,
}: {
  data: ParticipantData;
  onChangeWorkStatus?: (status: string | null) => void;
}) {
  const t = useTranslations("room.participantCard");
  const tCommon = useTranslations("room.common");
  const isOffline = data.presence === "offline";
  const color = PHASE_COLOR[data.phase];
  const avatarSrc = characterSrc(data.characterId);
  const cardBg = workStatusBg(data.workStatus);

  // work-status backgrounds are fixed light pastels regardless of theme, so
  // text sitting on them must stay dark even in dark mode — only the
  // default (no status set) card follows the page theme.
  const primaryTextClass = cardBg ? "text-neutral-900" : "text-neutral-900 dark:text-white";
  const secondaryTextClass = cardBg ? "text-neutral-600" : "text-neutral-600 dark:text-neutral-300";

  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-lg border p-3 ${
        data.isSelf ? "border-neutral-900 dark:border-white" : "border-neutral-200 dark:border-neutral-700"
      } ${cardBg ? "" : "bg-white dark:bg-neutral-900"}`}
      style={cardBg ? { backgroundColor: cardBg } : undefined}
    >
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-md bg-neutral-50 ${
          isOffline ? "grayscale" : ""
        }`}
      >
        {avatarSrc ? (
          <Image src={avatarSrc} alt="" fill sizes="240px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-neutral-300">
            🙂
          </div>
        )}
        <div className="absolute left-1 top-1 rounded-full bg-white/90 p-0.5 shadow-sm">
          <PomodoroDonut
            progress={isOffline ? 0 : data.elapsedFraction}
            color={isOffline ? "#d4d4d4" : color}
            size={40}
            strokeWidth={7}
          />
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRESENCE_DOT[data.presence]} ${
              data.presence === "typing" ? "animate-pulse" : ""
            }`}
          />
          <span className={`min-w-0 truncate text-sm font-medium ${primaryTextClass}`}>
            {data.name}
            {data.isSelf ? ` (${tCommon("self")})` : ""}
          </span>
        </span>
        {onChangeWorkStatus ? (
          <WorkStatusPicker
            current={data.workStatus}
            onChange={onChangeWorkStatus}
            onPastelBg={!!cardBg}
          />
        ) : (
          data.workStatus && (
            <span
              className={`shrink-0 rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] font-medium dark:border-neutral-600 ${secondaryTextClass}`}
            >
              {data.workStatus}
            </span>
          )
        )}
      </div>

      <div className="flex items-center justify-between text-[12px]">
        <span className={cardBg ? "text-neutral-600" : "text-neutral-500 dark:text-neutral-400"}>
          {data.recordsVisible
            ? `${data.accumulatedChars.toLocaleString()}${tCommon("charUnit")}`
            : tCommon("recordsPrivate")}
        </span>
        {isOffline ? (
          <span className={cardBg ? "text-neutral-500" : "text-neutral-400 dark:text-neutral-500"}>
            {data.lastSeenLabel ? t("lastSeen", { label: data.lastSeenLabel }) : t("neverSeen")}
          </span>
        ) : (
          <span className="font-medium" style={{ color }}>
            {t(`phase.${data.phase}`)}
          </span>
        )}
      </div>
    </div>
  );
}
