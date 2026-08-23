"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const SLOT_ID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

export function AdSlot({ className }: { className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT_ID || !SLOT_ID || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle script hasn't loaded yet (e.g. blocked by an ad
      // blocker) — nothing to do, the slot just stays empty.
    }
  }, []);

  if (!CLIENT_ID || !SLOT_ID) {
    return (
      <div className={`flex items-center justify-center text-[12px] text-neutral-300 ${className ?? ""}`}>
        광고 영역
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={CLIENT_ID}
      data-ad-slot={SLOT_ID}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
