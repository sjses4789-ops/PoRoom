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
  position: "novelist" | "webtoon";
  isOwner: boolean;
  isVice: boolean;
};

// PoRoom의 시그니처 색(뽀모도로 집중 색과 동일)을 화면 공유 켬 상태
// 표시에도 그대로 써서 브랜드 톤을 유지한다.
const SHARE_ACTIVE_COLOR = "#c17b7b";

function CameraIcon({ active, size = 15 }: { active: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden fill="none">
      <rect x="2" y="6" width="11" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.5" cy="10.5" r="2.1" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M13 9.2l4.2-2.3v6.8L13 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {active && <circle cx="15.5" cy="4.5" r="2" fill={SHARE_ACTIVE_COLOR} />}
    </svg>
  );
}

const PHASE_COLOR: Record<ParticipantData["phase"], string> = {
  focus: "#c17b7b",
  break: "#7b93c1",
  idle: "#8a8a8a",
};

// 이모지는 색을 바꿀 수 없어서(금색 왕관·핑크색 왕관을 구분해야 하므로)
// 직접 그린 왕관 SVG를 fill로 칠한다.
function CrownIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill={color} d="M2 18h20l-1.5-9-5 4-3.5-7-3.5 7-5-4L2 18z" />
    </svg>
  );
}

export type ScreenShareSlot = {
  isSharing: boolean;
  frameUrl: string | null;
  // 본인 카드에서만 채워진다 — 다른 참여자 카드에서는 눌러도 아무 일도
  // 일어나지 않아야 하므로 undefined로 둔다.
  onToggle?: () => void;
};

export function ParticipantCard({
  data,
  onChangeWorkStatus,
  selfPosition,
  screenShare,
}: {
  data: ParticipantData;
  onChangeWorkStatus?: (status: string | null) => void;
  // 상태 설정 선택지 목록이 직업(웹소설/웹툰)에 따라 달라진다 —
  // onChangeWorkStatus가 있는(=본인) 카드에서만 실제로 쓰인다.
  selfPosition?: "novelist" | "webtoon";
  screenShare?: ScreenShareSlot;
}) {
  const t = useTranslations("room.participantCard");
  const tCommon = useTranslations("room.common");
  const isOffline = data.presence === "offline";
  const color = PHASE_COLOR[data.phase];
  const avatarSrc = characterSrc(data.characterId);
  const cardBg = workStatusBg(data.workStatus);
  const isSharing = screenShare?.isSharing ?? false;
  const shareFrame = screenShare?.frameUrl ?? null;

  // work-status backgrounds are fixed light pastels regardless of theme, so
  // text sitting on them must stay dark even in dark mode — only the
  // default (no status set) card follows the page theme.
  const primaryTextClass = cardBg ? "text-neutral-900" : "text-neutral-900 dark:text-white";
  const secondaryTextClass = cardBg ? "text-neutral-600" : "text-neutral-600 dark:text-neutral-300";

  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-sm border p-3 ${
        data.isSelf ? "border-neutral-900 dark:border-white" : "border-neutral-200 dark:border-neutral-700"
      } ${cardBg ? "" : "bg-white dark:bg-neutral-900"}`}
      style={cardBg ? { backgroundColor: cardBg } : undefined}
    >
      {/* grayscale은 사진(아바타)에만 걸어야 한다 — 이 박스 전체에
          걸면 방장/부방장 왕관 배지까지 회색으로 바래서, 비접속
          상태에서도 왕관 색이 그대로 보여야 한다는 요구를 못 지킨다. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-neutral-50">
        {shareFrame ? (
          // 일부러 작게 캡처한 화면을 그대로 늘려서 그린다 —
          // image-rendering: pixelated로 부드럽게 보간하지 않고 픽셀이
          // 깨져 보이게 해서, 내용은 안 보이지만 뭔가 움직이고 있다는
          // 느낌만 전달한다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shareFrame}
            alt=""
            className="h-full w-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        ) : avatarSrc ? (
          <Image
            src={avatarSrc}
            alt=""
            fill
            sizes="240px"
            className={`object-cover ${isOffline ? "grayscale" : ""}`}
          />
        ) : (
          <div
            className={`flex h-full items-center justify-center text-2xl text-neutral-300 ${
              isOffline ? "grayscale" : ""
            }`}
          >
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
        {data.isOwner ? (
          <div
            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow-sm"
            title={t("ownerBadge")}
          >
            <CrownIcon color="#F2B705" size={16} />
          </div>
        ) : (
          data.isVice && (
            <div
              className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow-sm"
              title={t("viceBadge")}
            >
              <CrownIcon color="#F472B6" size={12} />
            </div>
          )
        )}
      </div>

      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          {screenShare?.onToggle ? (
            <button
              type="button"
              onClick={screenShare.onToggle}
              title={isSharing ? t("shareStop") : t("shareStart")}
              aria-pressed={isSharing}
              className={`flex shrink-0 items-center justify-center rounded-full p-0.5 transition hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                isSharing ? "text-[#c17b7b]" : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              <CameraIcon active={isSharing} />
            </button>
          ) : (
            <span
              title={isSharing ? t("shareOn") : undefined}
              className={`flex shrink-0 items-center justify-center rounded-full p-0.5 ${
                isSharing ? "text-[#c17b7b]" : "text-neutral-300 dark:text-neutral-600"
              }`}
            >
              <CameraIcon active={isSharing} />
            </span>
          )}
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
            position={selfPosition ?? "novelist"}
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
            ? `${data.accumulatedChars.toLocaleString()}${
                data.position === "webtoon" ? tCommon("cutUnit") : tCommon("charUnit")
              }`
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
