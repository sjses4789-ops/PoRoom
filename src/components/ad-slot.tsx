"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const SLOT_ID_BY_VARIANT = {
  horizontal: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID,
  vertical: process.env.NEXT_PUBLIC_ADSENSE_VERTICAL_SLOT_ID,
};

export function AdSlot({
  className,
  variant = "horizontal",
}: {
  className?: string;
  /** 광고 배치마다 애드센스에서 별도 광고 단위(슬롯 ID)를 만들어 쓴다. */
  variant?: "horizontal" | "vertical";
}) {
  const pushed = useRef(false);
  const slotId = SLOT_ID_BY_VARIANT[variant];

  useEffect(() => {
    if (!CLIENT_ID || !slotId || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle script hasn't loaded yet (e.g. blocked by an ad
      // blocker) — nothing to do, the slot just stays empty.
    }
  }, [slotId]);

  if (!CLIENT_ID || !slotId) {
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
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
