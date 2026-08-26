"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  updateRoomSettings,
  deleteRoom,
  kickMember,
  transferOwnership,
  setViceStatus,
  banMember,
  unbanMember,
  type BannedMember,
} from "@/lib/room-admin";
import { createCategory } from "@/lib/room-categories";
import { PALETTE, paletteDot } from "@/lib/palette";
import { ROOM_TAGS, translateRoomTag } from "@/lib/room-tags";
import { createClient } from "@/lib/supabase/client";
import type { RecordVisibility, JoinType } from "@/lib/rooms";

export type SettingsMember = { id: string; name: string; isVice: boolean };
export type SettingsCategory = { id: string; name: string; color: string };

export function RoomSettingsButton({
  roomId,
  currentName,
  currentColor,
  currentTags,
  currentJoinType,
  currentRecordVisibility,
  members,
  categories: initialCategories,
  bannedMembers: initialBannedMembers,
}: {
  roomId: string;
  currentName: string;
  currentColor: string;
  currentTags: string[];
  currentJoinType: JoinType;
  currentRecordVisibility: RecordVisibility;
  members: SettingsMember[];
  categories: SettingsCategory[];
  bannedMembers: BannedMember[];
}) {
  const t = useTranslations("room.roomSettingsButton");
  const tTags = useTranslations("tags");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(currentColor);
  const [tags, setTags] = useState<Set<string>>(new Set(currentTags));
  const toggleTag = (tag: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    const result = await updateRoomSettings(null, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  };

  // 방장 위임/부방장 지정을 다른 참여자의 화면(왕관 배지)에도 5초
  // 폴링을 기다리지 않고 곧바로 반영되도록, room-view.tsx가 구독 중인
  // 같은 채널로 방송한다(입장/퇴장 알림과 같은 방식).
  const broadcastMemberChange = (event: "owner-changed" | "vice-changed", payload: object) => {
    const supabase = createClient();
    const channel = supabase.channel(`room-members-list:${roomId}`);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({ type: "broadcast", event, payload });
        setTimeout(() => supabase.removeChannel(channel), 500);
      }
    });
  };

  const [busyId, setBusyId] = useState<string | null>(null);
  const [viceIds, setViceIds] = useState(
    new Set(members.filter((m) => m.isVice).map((m) => m.id))
  );
  const [bannedMembers, setBannedMembers] = useState(initialBannedMembers);
  const [kickedIds, setKickedIds] = useState<Set<string>>(new Set());
  const [banBusyId, setBanBusyId] = useState<string | null>(null);
  const [nukeStep, setNukeStep] = useState(0);
  const [nukeText, setNukeText] = useState("");
  const [nukePending, setNukePending] = useState(false);
  const [nukeError, setNukeError] = useState<string | null>(null);

  const [categories, setCategories] = useState(initialCategories);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState<string>(PALETTE[1].key);
  const [categoryPending, setCategoryPending] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const addCategory = async () => {
    setCategoryPending(true);
    setCategoryError(null);
    const result = await createCategory(roomId, categoryName, categoryColor);
    setCategoryPending(false);
    if ("error" in result) {
      setCategoryError(result.error);
      return;
    }
    setCategories((prev) => [...prev, result]);
    setCategoryName("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("settingsTitle")}
        title={t("settingsTitle")}
        className="rounded-md border border-neutral-200 p-2 text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        ⚙️
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-neutral-900/30"
          />
          <div className="fixed left-1/2 top-1/2 z-20 max-h-[85vh] w-[min(28rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-neutral-300 bg-white p-5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("settingsTitle")}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="hidden" name="roomId" value={roomId} />
              <label className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                {t("roomName")}
                <input
                  name="name"
                  defaultValue={currentName}
                  className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t("roomColor")}</span>
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
                          ? "ring-2 ring-neutral-900 ring-offset-2 dark:ring-white"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t("tagLabel")}</span>
                {Array.from(tags).map((tagValue) => (
                  <input key={tagValue} type="hidden" name="tags" value={tagValue} />
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
                      {translateRoomTag(tTags, tag)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t("joinTypeLabel")}</span>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    <input
                      type="radio"
                      name="joinType"
                      value="invite"
                      defaultChecked={currentJoinType === "invite"}
                      className="accent-neutral-900"
                    />
                    {t("joinInvite")}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    <input
                      type="radio"
                      name="joinType"
                      value="open"
                      defaultChecked={currentJoinType === "open"}
                      className="accent-neutral-900"
                    />
                    {t("joinOpen")}
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t("visibilityLabel")}</span>
                <div className="flex flex-col gap-1">
                  {(
                    [
                      { value: "shared", label: t("visibility.shared") },
                      { value: "private", label: t("visibility.private") },
                      { value: "free", label: t("visibility.free") },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                    >
                      <input
                        type="radio"
                        name="recordVisibility"
                        value={opt.value}
                        defaultChecked={currentRecordVisibility === opt.value}
                        className="accent-neutral-900"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {pending ? t("saving") : t("save")}
                </button>
                {saved && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {t("saved")}
                  </span>
                )}
              </div>
            </form>

            <div className="mt-5 flex flex-col gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{t("eventCategories")}</h3>
              {categories.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-2 py-1 text-[12px] text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${paletteDot(c.color)}`} />
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-1.5">
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder={t("categoryNamePlaceholder")}
                  className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                />
                <select
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)}
                  className="rounded-md border border-neutral-200 px-2 py-1.5 text-xs text-neutral-700 outline-none focus:border-neutral-400 dark:text-neutral-100"
                >
                  {PALETTE.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  disabled={categoryPending}
                  onClick={addCategory}
                  className="shrink-0 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {t("addCategory")}
                </button>
              </div>
              {categoryError && <p className="text-xs text-red-500">{categoryError}</p>}
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{t("memberManagement")}</h3>
              {members.filter((m) => !kickedIds.has(m.id)).length === 0 ? (
                <p className="text-xs text-neutral-400">{t("noOtherMembers")}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
                  {members.filter((m) => !kickedIds.has(m.id)).map((m) => {
                    const isVice = viceIds.has(m.id);
                    return (
                      <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="min-w-0 truncate text-sm text-neutral-900 dark:text-white">
                            {m.name}
                          </span>
                          {isVice && (
                            <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
                              {t("viceBadge")}
                            </span>
                          )}
                        </span>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          <button
                            disabled={busyId === m.id}
                            onClick={async () => {
                              setBusyId(m.id);
                              const next = !isVice;
                              await setViceStatus(roomId, m.id, next);
                              setViceIds((prev) => {
                                const copy = new Set(prev);
                                if (next) copy.add(m.id);
                                else copy.delete(m.id);
                                return copy;
                              });
                              broadcastMemberChange("vice-changed", { userId: m.id, isVice: next });
                              setBusyId(null);
                              // 방송은 다른 사람 화면용 — 내 화면(참여자
                              // 카드)에는 내 소켓 연결로 되돌아오지 않으니
                              // 새로고침으로 반영한다.
                              router.refresh();
                            }}
                            className="rounded-md border border-sky-200 px-2 py-1 text-[12px] font-medium text-sky-600 transition hover:bg-sky-50 disabled:opacity-50"
                          >
                            {isVice ? t("viceUnset") : t("viceSet")}
                          </button>
                          <button
                            disabled={busyId === m.id}
                            onClick={async () => {
                              setBusyId(m.id);
                              await transferOwnership(roomId, m.id);
                              broadcastMemberChange("owner-changed", { userId: m.id });
                              setBusyId(null);
                              setOpen(false);
                              // 방장이 바뀌면 이 설정 버튼 자체가 더 이상
                              // 안 보여야 하는 등 서버에서 계산해 내려주는
                              // 값들이 여럿 바뀌므로 새로고침한다.
                              router.refresh();
                            }}
                            className="rounded-md border border-neutral-200 px-2 py-1 text-[12px] font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                          >
                            {t("transferOwnership")}
                          </button>
                          <button
                            disabled={busyId === m.id}
                            onClick={async () => {
                              if (
                                !window.confirm(t("kickConfirm", { name: m.name }))
                              ) {
                                return;
                              }
                              setBusyId(m.id);
                              await kickMember(roomId, m.id);
                              setBusyId(null);
                              setKickedIds((prev) => new Set(prev).add(m.id));
                            }}
                            className="rounded-md border border-red-200 px-2 py-1 text-[12px] font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {t("kick")}
                          </button>
                          <button
                            disabled={banBusyId === m.id}
                            onClick={async () => {
                              if (!window.confirm(t("banConfirm", { name: m.name }))) {
                                return;
                              }
                              setBanBusyId(m.id);
                              await banMember(roomId, m.id);
                              setBanBusyId(null);
                              setKickedIds((prev) => new Set(prev).add(m.id));
                              setBannedMembers((prev) => [{ userId: m.id, name: m.name }, ...prev]);
                            }}
                            className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[12px] font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:hover:bg-red-950/70"
                          >
                            {t("ban")}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {bannedMembers.length > 0 && (
              <div className="mt-5 flex flex-col gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{t("bannedMembers")}</h3>
                <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
                  {bannedMembers.map((b) => (
                    <li key={b.userId} className="flex items-center justify-between gap-2 py-2">
                      <span className="min-w-0 truncate text-sm text-neutral-500 dark:text-neutral-400">
                        {b.name}
                      </span>
                      <button
                        disabled={banBusyId === b.userId}
                        onClick={async () => {
                          setBanBusyId(b.userId);
                          await unbanMember(roomId, b.userId);
                          setBanBusyId(null);
                          setBannedMembers((prev) => prev.filter((x) => x.userId !== b.userId));
                        }}
                        className="shrink-0 rounded-md border border-neutral-200 px-2 py-1 text-[12px] font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        {t("unban")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 border-t border-red-100 pt-4 dark:border-red-900/40">
              <h3 className="text-xs font-semibold text-red-500">{t("dangerZone")}</h3>
              {nukeStep < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(t("nukeConfirm1"))) {
                      return;
                    }
                    if (!window.confirm(t("nukeConfirm2", { name: currentName }))) {
                      return;
                    }
                    setNukeError(null);
                    setNukeStep(2);
                  }}
                  className="self-start rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                >
                  {t("nukeButton")}
                </button>
              ) : (
                <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {t("nukeWarningPrefix")}{" "}
                    <span className="font-semibold">&quot;{currentName}&quot;</span>
                    {t("nukeWarningSuffix")}
                  </p>
                  <input
                    value={nukeText}
                    onChange={(e) => setNukeText(e.target.value)}
                    placeholder={currentName}
                    className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-red-900/50 dark:bg-neutral-900 dark:text-white outline-none focus:border-red-400"
                  />
                  {nukeError && <p className="text-xs text-red-600">{nukeError}</p>}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={nukeText !== currentName || nukePending}
                      onClick={async () => {
                        setNukePending(true);
                        const result = await deleteRoom(roomId);
                        setNukePending(false);
                        if (result?.error) {
                          setNukeError(result.error);
                          return;
                        }

                        // let anyone with the 포룸 list open drop this
                        // room's card immediately instead of waiting on
                        // DB-change replication.
                        await new Promise<void>((resolve) => {
                          const supabase = createClient();
                          const channel = supabase.channel("main-rooms");
                          let done = false;
                          const finish = () => {
                            if (done) return;
                            done = true;
                            supabase.removeChannel(channel);
                            resolve();
                          };
                          channel.subscribe((status) => {
                            if (status === "SUBSCRIBED") {
                              channel.send({
                                type: "broadcast",
                                event: "room-deleted",
                                payload: { roomId },
                              });
                              finish();
                            } else if (
                              status === "CHANNEL_ERROR" ||
                              status === "TIMED_OUT" ||
                              status === "CLOSED"
                            ) {
                              finish();
                            }
                          });
                          setTimeout(finish, 1500);
                        });

                        router.push("/main");
                      }}
                      className="flex-1 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {nukePending ? t("deleting") : t("permanentDelete")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNukeStep(0);
                        setNukeText("");
                        setNukeError(null);
                      }}
                      className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
