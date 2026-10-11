"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { NoteDialog } from "@/components/note-dialog";
import { deleteNote, getInbox, getUnreadNoteCount, markNoteRead, sendNote, type NoteItem } from "@/lib/notes";

function MailIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 7.5l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 상단바 닉네임 왼쪽의 우편함 아이콘 — 안 읽은 쪽지 수를 뱃지로 보여 주고, 누르면 받은 쪽지 목록과 내용을
// 볼 수 있는 팝업이 뜬다. 새 쪽지는 실시간으로 반영된다(느려지면 1분마다 한 번 다시 확인).
export function NotesInbox({ userId }: { userId: string }) {
  const t = useTranslations("notes.inbox");
  // 이 컴포넌트는 상단바에 두 번(모바일/데스크톱 배치) 그려진다 — 같은 이름의 채널을 두 번 만들면 오류가
  // 나므로 인스턴스마다 이름을 다르게 한다.
  const instanceId = useId();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notes, setNotes] = useState<NoteItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<NoteItem | null>(null);

  const refreshCount = useCallback(async () => {
    setUnread(await getUnreadNoteCount());
  }, []);

  const loadInbox = useCallback(async () => {
    const result = await getInbox();
    setNotes(result.notes);
    setUnread(result.unread);
  }, []);

  // 팝업이 열려 있을 때만 새 쪽지가 올 때 목록도 다시 불러온다.
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCount();
    const supabase = createClient();
    const channel = supabase
      .channel(`notes:${userId}:${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_notes", filter: `recipient_id=eq.${userId}` },
        () => {
          void refreshCount();
          if (openRef.current) void loadInbox();
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
  }, [userId, instanceId, refreshCount, loadInbox]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInbox();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !replyTo) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loadInbox, replyTo]);

  const selected = notes?.find((n) => n.id === selectedId) ?? null;

  const select = async (n: NoteItem) => {
    setSelectedId(n.id);
    if (!n.read) {
      setNotes((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? prev);
      setUnread((c) => Math.max(0, c - 1));
      await markNoteRead(n.id);
    }
  };

  const remove = async (n: NoteItem) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setNotes((prev) => prev?.filter((x) => x.id !== n.id) ?? prev);
    setSelectedId(null);
    if (!n.read) setUnread((c) => Math.max(0, c - 1));
    await deleteNote(n.id);
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
        <MailIcon size={18} />
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
            className="fixed left-1/2 top-1/2 z-[60] flex max-h-[85vh] w-[min(46rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-neutral-300 bg-white text-left text-sm font-normal text-neutral-900 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3 dark:border-neutral-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                <MailIcon size={16} />
                {t("title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[16rem_1fr]">
              <ul className="max-h-48 overflow-y-auto border-b border-neutral-100 sm:max-h-none sm:border-b-0 sm:border-r dark:border-neutral-800">
                {notes === null ? (
                  <li className="px-4 py-6 text-center text-xs text-neutral-400">{t("loading")}</li>
                ) : notes.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-neutral-400">{t("empty")}</li>
                ) : (
                  notes.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => select(n)}
                        className={`flex w-full flex-col gap-0.5 border-b border-neutral-50 px-4 py-2.5 text-left transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 ${
                          selectedId === n.id ? "bg-neutral-50 dark:bg-neutral-800" : ""
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-[12px]">
                          {!n.read && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />}
                          <span className={`truncate ${n.read ? "text-neutral-600 dark:text-neutral-300" : "font-semibold text-neutral-900 dark:text-white"}`}>
                            {n.senderName}
                          </span>
                          <span className="ml-auto shrink-0 text-[11px] text-neutral-400">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">{n.content}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="flex min-h-[10rem] flex-col gap-3 overflow-y-auto px-5 py-4">
                {selected ? (
                  <>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold text-neutral-900 dark:text-white">{selected.senderName}</span>
                      {selected.roomName && <span>· {selected.roomName}</span>}
                      <span>· {new Date(selected.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {selected.content}
                    </p>
                    <div className="mt-auto flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setReplyTo(selected)}
                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                      >
                        {t("reply")}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(selected)}
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-red-500 transition hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="m-auto text-xs text-neutral-400">{t("selectHint")}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {replyTo && (
        <NoteDialog
          targetName={replyTo.senderName}
          onClose={() => setReplyTo(null)}
          onSubmit={async (content) => {
            const result = await sendNote(replyTo.senderId, replyTo.roomId, content);
            return "error" in result ? result.error : null;
          }}
        />
      )}
    </>
  );
}
