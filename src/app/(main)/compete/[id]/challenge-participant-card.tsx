import Image from "next/image";
import { characterSrc } from "@/lib/characters";

export function ChallengeParticipantCard({
  name,
  characterId,
  chars,
  target,
  achieved,
}: {
  name: string;
  characterId: string | null;
  chars?: number;
  target?: number;
  achieved: boolean;
}) {
  const avatarSrc = characterSrc(characterId);

  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-lg border p-3 ${
        achieved
          ? "border-emerald-300 dark:border-emerald-700"
          : "border-neutral-200 dark:border-neutral-700"
      } bg-white dark:bg-neutral-900`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-neutral-50 dark:bg-neutral-800">
        {avatarSrc ? (
          <Image src={avatarSrc} alt="" fill sizes="240px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-neutral-300">
            🙂
          </div>
        )}
      </div>
      <span className="min-w-0 truncate text-sm font-medium text-neutral-900 dark:text-white">
        {name}
      </span>
      <div className="flex items-center justify-between text-[12px]">
        {chars !== undefined ? (
          <span className="text-neutral-500 dark:text-neutral-400">
            {chars.toLocaleString()}
            {target ? ` / ${target.toLocaleString()}` : ""}자
          </span>
        ) : (
          <span />
        )}
        {achieved ? (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">달성 ✅</span>
        ) : (
          <span className="text-neutral-400">미달성</span>
        )}
      </div>
    </div>
  );
}
