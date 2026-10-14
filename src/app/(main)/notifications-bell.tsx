"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  syncMyNotifications,
  type NotificationItem,
} from "@/lib/notifications";
import { formatRelativeTime } from "@/lib/time";

const SYNC_STORAGE_KEY = "poroom:notifications-synced-at";
const SYNC_INTERVAL_MS = 60 * 60 * 1000;

function BellIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden>
      <path
        d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5l1.5-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 20.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

// 상단바 우편함 왼쪽의 벨 아이콘 — 귓속말 도착, 신고 처리 결과, 챌린지·대결 결과, 주간 집필 리포트를 모아 보여 준다.
// 안 읽은 알림 수를 뱃지로 보여 주고, 새 알림은 실시간으로 반영된다.
export function NotificationsBell({ userId }: { userId: string }) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const pathname = usePathname();
  // 이 컴포넌트는 상단바에 두 번(모바일/데스크톱 배치) 그려진다 — 채널 이름이 겹치지 않게 인스턴스마다 다르게 한다.
  const instanceId = useId();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  const refreshCount = useCallback(async () => {
    setUnread(await getUnreadNotificationCount());
  }, []);

  const loadList = useCallback(async () => {
    const result = await getNotifications();
    setItems(result.items);
    setUnread(result.unread);
  }, []);

  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // 한 시간에 한 번만(여러 탭·두 개의 벨이 같이 부르지 않게 저장소 시각으로 거른다) 새 알림을 만든다.
    let shouldSync = true;
    try {
      const last = Number(window.localStorage.getItem(SYNC_STORAGE_KEY) ?? 0);
      if (Date.now() - last < SYNC_INTERVAL_MS) shouldSync = false;
      else window.localStorage.setItem(SYNC_STORAGE_KEY, String(Date.now()));
    } catch {
      // 저장소를 못 쓰면 매번 부른다.
    }
    void (async () => {
      if (shouldSync) await syncMyNotifications();
      await refreshCount();
    })();

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}:${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          void refreshCount();
          if (openRef.current) void loadList();
        }
      )
      .subscribe();
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") void refreshCount();
    }, 60_000);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId, refreshCount, loadList]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadList();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loadList]);

  const unitLabel = (n: number, metric: string, targetPosition: unknown) => {
    const value = n.toLocaleString();
    if (metric === "minutes") return t("unitMinutes", { n: value });
    return targetPosition === "webtoon" ? t("unitCuts", { n: value }) : t("unitChars", { n: value });
  };

  const describe = (n: NotificationItem): { title: string; sub?: string } => {
    const p = n.params;
    switch (n.kind) {
      case "whisper":
        return {
          title: t("whisper", { from: String(p.from ?? "") }),
          sub: p.room ? t("whisperRoom", { room: String(p.room) }) : undefined,
        };
      case "report_resolved":
        return { title: p.isMessage ? t("reportResolvedMessage") : t("reportResolved") };
      case "challenge_result": {
        const title = String(p.title ?? "");
        const metric = String(p.metric ?? "chars");
        const rank = Number(p.rank ?? 0);
        const total = Number(p.total ?? 0);
        const success = Boolean(p.success);
        if (metric === "achievement") {
          return { title: success ? t("achievementDone", { title }) : t("achievementMiss", { title }) };
        }
        const value = unitLabel(Number(p.value ?? 0), metric, p.targetPosition);
        if (p.type === "duel") {
          return {
            title: success ? t("duelWin", { title, total, value }) : t("duelEnd", { title, total, rank, value }),
          };
        }
        return {
          title: success ? t("eventDone", { title, total, rank, value }) : t("eventEnd", { title, total, rank, value }),
        };
      }
      case "weekly_report":
        return {
          title: t("weeklyTitle"),
          sub: t("weeklyBody", {
            chars: Number(p.chars ?? 0).toLocaleString(),
            minutes: Number(p.focusMinutes ?? 0).toLocaleString(),
            days: Number(p.activeDays ?? 0),
            streak: Number(p.streak ?? 0),
          }),
        };
    }
  };

  // 지금 그 방 화면을 보고 있으면 귓속말 알림은 쌓지 않고 바로 읽음으로 처리한다.
  useEffect(() => {
    if (!items || document.visibilityState !== "visible") return;
    const seen = items.filter((n) => n.kind === "whisper" && !n.read && n.link && n.link === pathname);
    if (seen.length === 0) return;
    for (const n of seen) void markNotificationRead(n.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems((prev) => prev?.map((x) => (seen.some((s) => s.id === x.id) ? { ...x, read: true } : x)) ?? prev);
    setUnread((c) => Math.max(0, c - seen.length));
  }, [items, pathname]);

  const select = async (n: NotificationItem) => {
    if (!n.read) {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? prev);
      setUnread((c) => Math.max(0, c - 1));
      void markNotificationRead(n.id);
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const remove = async (n: NotificationItem) => {
    setItems((prev) => prev?.filter((x) => x.id !== n.id) ?? prev);
    if (!n.read) setUnread((c) => Math.max(0, c - 1));
    await deleteNotification(n.id);
  };

  const readAll = async () => {
    setItems((prev) => prev?.map((x) => ({ ...x, read: true })) ?? prev);
    setUnread(0);
    await markAllNotificationsRead();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("title")}
        aria-label={t("title")}
        className="relative shrink-0 rounded-md p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        <BellIcon size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-400 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-neutral-900/40" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="fixed left-1/2 top-1/2 z-[60] flex max-h-[80vh] w-[min(26rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-neutral-300 bg-white text-left text-sm font-normal text-neutral-900 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                <BellIcon size={16} />
                {t("title")}
              </h2>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={readAll}
                    className="text-[11px] text-neutral-500 transition hover:text-neutral-900 hover:underline dark:hover:text-white"
                  >
                    {t("markAll")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("close")}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  ✕
                </button>
              </div>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {items === null ? (
                <li className="px-4 py-6 text-center text-xs text-neutral-400">{t("loading")}</li>
              ) : items.length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-neutral-400">{t("empty")}</li>
              ) : (
                items.map((n) => {
                  const text = describe(n);
                  return (
                    <li
                      key={n.id}
                      className="group flex items-start gap-2 border-b border-neutral-100 px-4 py-3 last:border-b-0 dark:border-neutral-800"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-red-400"}`}
                        aria-hidden
                      />
                      <button type="button" onClick={() => select(n)} className="min-w-0 flex-1 text-left">
                        <p className={`text-[13px] leading-snug ${n.read ? "text-neutral-500" : "font-medium text-neutral-900 dark:text-white"}`}>
                          {text.title}
                        </p>
                        {text.sub && <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">{text.sub}</p>}
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          {formatRelativeTime(n.createdAt, {
                            justNow: t("justNow"),
                            minutesAgo: (count: number) => t("minutesAgo", { count }),
                            hoursAgo: (count: number) => t("hoursAgo", { count }),
                          })}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(n)}
                        title={t("delete")}
                        aria-label={t("delete")}
                        className="shrink-0 text-[11px] text-neutral-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-neutral-600"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
