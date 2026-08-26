"use client";

import { createContext, useContext, useRef, useState } from "react";

type DeltaListener = (delta: number) => void;

// RoomView(방 탭)와 RoomRecordsPanel(기록 탭)은 RoomTabs 아래의 형제
// 컴포넌트라 서로의 state에 직접 접근할 수 없다 — 기록 탭에서 오늘 날짜의
// 글자수를 수정하면 방 탭의 "글자수 기록" 표시(오늘 목표 진행률)도 즉시
// 반영되어야 해서, 그 변화량(delta)만 오가는 작은 알림 채널을 둔다.
// 실제 글자수 값 자체는 여전히 RoomView가 들고 있고, 여기는 "오늘 값이
// 이만큼 바뀌었다"는 이벤트만 전달하는 통로다.
type TodayCharsSyncValue = {
  subscribe: (fn: DeltaListener) => () => void;
  notifyTodayDelta: (delta: number) => void;
};

const TodayCharsSyncContext = createContext<TodayCharsSyncValue | null>(null);

export function TodayCharsSyncProvider({ children }: { children: React.ReactNode }) {
  const listenersRef = useRef(new Set<DeltaListener>());
  // 렌더 중에는 ref를 읽지 않도록, 컨텍스트에 내려줄 값 자체는 최초
  // 렌더 시 한 번만 만들어 state로 고정해둔다(참조가 안정적이라 이후
  // 리렌더돼도 구독자들이 다시 구독할 필요가 없다).
  const [value] = useState<TodayCharsSyncValue>(() => ({
    subscribe: (fn) => {
      listenersRef.current.add(fn);
      return () => {
        listenersRef.current.delete(fn);
      };
    },
    notifyTodayDelta: (delta) => {
      if (delta === 0) return;
      listenersRef.current.forEach((fn) => fn(delta));
    },
  }));

  return (
    <TodayCharsSyncContext.Provider value={value}>{children}</TodayCharsSyncContext.Provider>
  );
}

export function useTodayCharsSync() {
  return useContext(TodayCharsSyncContext);
}
