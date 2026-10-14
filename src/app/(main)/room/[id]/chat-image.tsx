"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export const CHAT_IMAGE_BUCKET = "chat-images";
export const CHAT_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const CHAT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
// 사진 보관 기간 — 0071 마이그레이션의 읽기 정책과 같은 값. 지나면 열리지 않고 파일도 지워진다.
export const CHAT_IMAGE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

// 서명된 주소(1시간 유효)를 한 번 받아 두고 같은 사진은 다시 요청하지 않는다.
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const urlCache = new Map<string, { url: string; expiresAt: number }>();

// 채팅에 첨부된 사진 — 비공개 버킷이라 로그인한 방 참여자만 서명된 임시 주소로 볼 수 있다. 누르면 크게 열린다.
export function ChatImage({ path, createdAt }: { path: string; createdAt?: string }) {
  const t = useTranslations("room.chatPanel");
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  // 렌더 중 Date.now()를 쓸 수 없어서 마운트 때 한 번 계산한다.
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (createdAt && Date.now() - new Date(createdAt).getTime() > CHAT_IMAGE_RETENTION_MS) setExpired(true);
  }, [createdAt]);

  useEffect(() => {
    if (expired || url) return;
    const cached = urlCache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrl(cached.url);
      return;
    }
    let cancelled = false;
    createClient()
      .storage.from(CHAT_IMAGE_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setFailed(true);
          return;
        }
        urlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + (SIGNED_URL_TTL_SECONDS - 60) * 1000 });
        setUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [path, url, expired]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (expired) {
    return <span className="text-xs text-neutral-400">{t("imageExpired")}</span>;
  }
  if (failed) {
    return <span className="text-xs text-neutral-400">{t("imageLoadFailed")}</span>;
  }
  if (!url) {
    return <span className="block h-24 w-40 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />;
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={t("imageAlt")} className="max-h-56 max-w-full rounded-md object-contain" />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-neutral-900/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={t("imageAlt")} className="max-h-full max-w-full rounded-md object-contain" />
        </div>
      )}
    </>
  );
}

// 사진을 보내기 전에 보여 주고 한 번 더 확인받는 팝업(붙여넣기·파일 선택 공통).
export function ChatImageConfirm({
  previewUrl,
  whisperName,
  sending,
  onSend,
  onCancel,
}: {
  previewUrl: string;
  whisperName: string | null;
  sending: boolean;
  onSend: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("room.chatPanel");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, sending]);

  return (
    <>
      <div onClick={sending ? undefined : onCancel} className="fixed inset-0 z-[60] bg-neutral-900/50" />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-[65] flex max-h-[85vh] w-[min(26rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-lg border border-neutral-300 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
      >
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{t("imageConfirmTitle")}</p>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-neutral-100 p-2 dark:bg-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={t("imageAlt")} className="max-h-[50vh] max-w-full rounded object-contain" />
        </div>
        <p className="text-[11px] text-neutral-400">{t("imageRetentionHint")}</p>
        {whisperName && (
          <p className="text-xs text-amber-600 dark:text-amber-400">🤫 {t("imageConfirmWhisper", { name: whisperName })}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t("imageConfirmCancel")}
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {sending ? t("imageSending") : t("imageConfirmSend")}
          </button>
        </div>
      </div>
    </>
  );
}
