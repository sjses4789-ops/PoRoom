"use client";

import { useCallback, useRef, useState } from "react";
import { getNicknameContext, type NicknameItem } from "@/lib/nicknames";
import { NicknamePicker } from "@/components/nickname-picker";

type Context = { defaultName: string; nicknames: NicknameItem[] };
// null = 취소(입장하지 않음), { nicknameId: null } = 기본 닉네임 사용.
export type NicknameChoice = { nicknameId: string | null } | null;

// 방에 "입장하기 전에" 이 방에서 쓸 닉네임을 먼저 고르게 한다. 입장 뒤에 고르면 고르기 전까지 기본
// 닉네임이 방 사람들에게 보이므로, 입장 동작(방 만들기·초대코드·오픈방·마감/새벽방)은 이 선택을 받은
// 뒤에 실행하고 선택한 닉네임을 입장과 함께 저장한다.
//
//   const chooser = useNicknameChooser();
//   const choice = await chooser.ask();   // 안내창을 띄우고 선택을 기다린다
//   if (!choice) return;                  // 닫았으면 입장하지 않는다
//   ...choice.nicknameId로 입장...
//   return <>{...}{chooser.element}</>;   // 안내창이 그려질 자리
export function useNicknameChooser() {
  const [context, setContext] = useState<Context | null>(null);
  const resolverRef = useRef<((choice: NicknameChoice) => void) | null>(null);

  const finish = useCallback((choice: NicknameChoice) => {
    resolverRef.current?.(choice);
    resolverRef.current = null;
    setContext(null);
  }, []);

  const ask = useCallback(async (): Promise<NicknameChoice> => {
    const ctx = await getNicknameContext();
    return new Promise<NicknameChoice>((resolve) => {
      resolverRef.current = resolve;
      setContext(ctx);
    });
  }, []);

  const element = context ? (
    <NicknamePicker
      defaultName={context.defaultName}
      nicknames={context.nicknames}
      forced={false}
      onSelect={async (nicknameId) => {
        finish({ nicknameId });
        return null;
      }}
      onClose={() => finish(null)}
    />
  ) : null;

  return { ask, element };
}
