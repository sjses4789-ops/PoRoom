"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { decomposeChar } from "@/lib/hangul";
import { pickRandomSentence } from "@/lib/typing-sentences";
import { submitTypingScore } from "@/lib/rest";
import { KeyboardView } from "./keyboard-view";

// 한글 타자 속도는 "완성된 글자 수"가 아니라 "실제로 누른 자판 수(타수)"로
// 세는 게 관례다(한컴타자 등 대부분의 한글 타자 연습 프로그램/사이트가
// 이 방식). 음절 하나(예: "글")도 두벌식으로는 자음+모음+받침, 즉 여러
// 번의 키 입력으로 이뤄지기 때문에 — 완성 글자 수만 세면 실제 타자
// 속도보다 훨씬 낮게 나온다. 영문은 한 글자가 곧 한 번의 키 입력이라
// 이 계산이 자연스럽게 그대로 맞아떨어진다.
function keystrokeCount(text: string): number {
  let total = 0;
  for (const ch of text) total += decomposeChar(ch).length || 1;
  return total;
}

const LIVE_TICK_MS = 200;

export function TypingPractice({ myBestCpm }: { myBestCpm: number | null }) {
  const t = useTranslations("rest.typing");
  const locale = useLocale();
  const [sentence, setSentence] = useState(() => pickRandomSentence(locale));
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ cpm: number; accuracy: number } | null>(null);
  const [bestCpm, setBestCpm] = useState(myBestCpm);
  const inputRef = useRef<HTMLInputElement>(null);
  const finalizingRef = useRef(false);

  // 입력 중일 때만 실시간으로 현재 타자 속도를 갱신한다.
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), LIVE_TICK_MS);
    return () => clearInterval(id);
  }, [startedAt]);

  const liveCpm =
    startedAt !== null && now !== null
      ? Math.round(keystrokeCount(input) / Math.max((now - startedAt) / 60000, 1 / 60))
      : null;

  const finalizeAndAdvance = () => {
    if (finalizingRef.current || input.length === 0 || startedAt === null) return;
    finalizingRef.current = true;

    const elapsedMinutes = Math.max((Date.now() - startedAt) / 60000, 1 / 60);
    const cpm = Math.round(keystrokeCount(input) / elapsedMinutes);
    let correct = 0;
    for (let i = 0; i < sentence.length; i++) {
      if (input[i] === sentence[i]) correct++;
    }
    const accuracy = Math.round((correct / sentence.length) * 100);

    setLastResult({ cpm, accuracy });
    submitTypingScore(cpm, accuracy).then((res) => {
      if (res && "ok" in res) {
        setBestCpm((prev) => (prev === null ? cpm : Math.max(prev, cpm)));
      }
    });

    setSentence(pickRandomSentence(locale, sentence));
    setInput("");
    setStartedAt(null);
    setNow(null);
    finalizingRef.current = false;
    inputRef.current?.focus();
  };

  const onChange = (value: string) => {
    if (value.length > sentence.length) return;
    if (startedAt === null && value.length > 0) {
      const start = Date.now();
      setStartedAt(start);
      setNow(start);
    }
    setInput(value);
    if (value === sentence) finalizeAndAdvance();
  };

  const nextCharKeys =
    input.length < sentence.length ? decomposeChar(sentence[input.length]) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <span className="text-xs text-neutral-400">
          {bestCpm !== null ? t("myBest", { cpm: bestCpm }) : t("noBestYet")}
        </span>
      </div>

      <div className="rounded-sm border border-neutral-400 p-5 dark:border-neutral-600">
        <div className="mb-3 flex items-center justify-center gap-4 text-xs">
          {liveCpm !== null ? (
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {t("liveCpm", { cpm: liveCpm })}
            </span>
          ) : (
            <span className="text-neutral-400">{t("readyHint")}</span>
          )}
          {lastResult && (
            <span className="text-neutral-400">
              {t("lastResult", { cpm: lastResult.cpm, accuracy: lastResult.accuracy })}
            </span>
          )}
        </div>
        <div
          className="text-center text-lg leading-relaxed tracking-wide"
          onClick={() => inputRef.current?.focus()}
        >
          {sentence.split("").map((ch, i) => {
            const typedChar = input[i];
            const state =
              typedChar === undefined ? "pending" : typedChar === ch ? "correct" : "incorrect";
            return (
              <span
                key={i}
                className={
                  state === "correct"
                    ? "text-neutral-300 dark:text-neutral-600"
                    : state === "incorrect"
                      ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                      : "text-neutral-900 dark:text-white"
                }
              >
                {ch}
              </span>
            );
          })}
        </div>
      </div>

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finalizeAndAdvance();
          }
        }}
        autoFocus
        placeholder={t("inputPlaceholder")}
        className="rounded-sm border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600 dark:border-neutral-600 dark:text-white dark:focus:border-neutral-400"
      />

      <KeyboardView activeKeys={nextCharKeys} />
    </div>
  );
}
