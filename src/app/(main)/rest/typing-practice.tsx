"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { decomposeChar } from "@/lib/hangul";
import { pickRandomSentence } from "@/lib/typing-sentences";
import { submitTypingScore } from "@/lib/rest";
import { KeyboardView } from "./keyboard-view";

// 한글 타자 속도 계산법 두 가지를 절충한다.
// - 완성 글자 수(음절 수) 기준: 대부분의 일반적인 "분당 글자 수" 감각과
//   가깝지만, 두벌식은 음절 하나가 자음+모음(+받침) 등 여러 번의 키
//   입력으로 이뤄지기 때문에 실제 체감 속도보다 훨씬 낮게 나온다.
// - 실제 키 입력 수(타수) 기준: 한컴타자 등 한글 타자 프로그램들이 쓰는
//   방식이지만, 완성 글자 수보다 2~3배 커서 오히려 다른 곳보다 훨씬
//   빠르게 나온다는 피드백을 받았다.
// 그래서 두 값의 평균을 "분당 타수"로 쓴다 — 어느 한쪽 방식만 쓰는
// 곳보다 체감상 중간 정도로 나온다. 영문은 한 글자가 곧 한 번의 입력이라
// 두 값이 같아서 이 평균이 그대로 글자 수 기준과 일치한다.
function typingSpeedUnits(text: string): number {
  let syllables = 0;
  let keystrokes = 0;
  for (const ch of text) {
    syllables += 1;
    keystrokes += decomposeChar(ch).length || 1;
  }
  return (syllables + keystrokes) / 2;
}

const LIVE_TICK_MS = 200;

type Stage = "typing" | "result";

export function TypingPractice({ myBestCpm }: { myBestCpm: number | null }) {
  const t = useTranslations("rest.typing");
  const locale = useLocale();
  const [sentence, setSentence] = useState(() => pickRandomSentence(locale));
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>("typing");
  const [result, setResult] = useState<{ cpm: number; accuracy: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ cpm: number; accuracy: number } | null>(null);
  const [bestCpm, setBestCpm] = useState(myBestCpm);
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력 중일 때만 실시간으로 현재 타자 속도를 갱신한다.
  useEffect(() => {
    if (startedAt === null || stage !== "typing") return;
    const id = setInterval(() => setNow(Date.now()), LIVE_TICK_MS);
    return () => clearInterval(id);
  }, [startedAt, stage]);

  const liveCpm =
    startedAt !== null && now !== null
      ? Math.round(typingSpeedUnits(input) / Math.max((now - startedAt) / 60000, 1 / 60))
      : null;

  // 1번째 엔터(또는 문장을 정확히 다 쳤을 때): 그 시점까지의 기록을
  // 평가해서 예문이 있던 자리에 보여준다. 아직 다음 문장으로는 넘어가지
  // 않는다.
  const evaluate = () => {
    if (startedAt === null || input.length === 0) return;
    const elapsedMinutes = Math.max((Date.now() - startedAt) / 60000, 1 / 60);
    const cpm = Math.round(typingSpeedUnits(input) / elapsedMinutes);
    let correct = 0;
    for (let i = 0; i < sentence.length; i++) {
      if (input[i] === sentence[i]) correct++;
    }
    const accuracy = Math.round((correct / sentence.length) * 100);

    const r = { cpm, accuracy };
    setResult(r);
    setLastResult(r);
    setStage("result");
    submitTypingScore(cpm, accuracy).then((res) => {
      if (res && "ok" in res) {
        setBestCpm((prev) => (prev === null ? cpm : Math.max(prev, cpm)));
      }
    });
  };

  // 2번째 엔터: 다음 문장으로 넘어가고 입력칸을 비운다.
  const advance = () => {
    setSentence(pickRandomSentence(locale, sentence));
    setInput("");
    setStartedAt(null);
    setNow(null);
    setResult(null);
    setStage("typing");
    inputRef.current?.focus();
  };

  const onChange = (value: string) => {
    if (stage !== "typing") return;
    if (value.length > sentence.length) return;
    if (startedAt === null && value.length > 0) {
      const start = Date.now();
      setStartedAt(start);
      setNow(start);
    }
    setInput(value);
    if (value === sentence) evaluate();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (stage === "typing") evaluate();
    else advance();
  };

  const nextCharKeys =
    stage === "typing" && input.length < sentence.length
      ? decomposeChar(sentence[input.length])
      : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {bestCpm !== null ? t("myBest", { cpm: bestCpm }) : t("noBestYet")}
        </span>
      </div>

      <div
        className="rounded-sm border border-neutral-400 p-5 dark:border-neutral-600"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="mb-3 flex items-center justify-center gap-4 text-xs">
          {stage === "typing" && (
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">
              {liveCpm !== null ? t("liveCpm", { cpm: liveCpm }) : t("readyHint")}
            </span>
          )}
          {stage === "typing" && lastResult && (
            <span className="font-medium text-neutral-600 dark:text-neutral-300">
              {t("lastResult", { cpm: lastResult.cpm, accuracy: lastResult.accuracy })}
            </span>
          )}
        </div>

        {stage === "result" && result ? (
          <div className="flex flex-col items-center gap-1.5 py-2">
            <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {t("cpmValue", { cpm: result.cpm })}
            </p>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              {t("accuracyValue", { accuracy: result.accuracy })}
            </p>
            <p className="mt-1 text-xs text-neutral-400">{t("pressEnterNext")}</p>
          </div>
        ) : (
          <div className="text-center text-lg leading-relaxed tracking-wide">
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
        )}
      </div>

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        readOnly={stage === "result"}
        autoFocus
        placeholder={t("inputPlaceholder")}
        className="rounded-sm border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600 dark:border-neutral-600 dark:text-white dark:focus:border-neutral-400"
      />

      <KeyboardView activeKeys={nextCharKeys} />
    </div>
  );
}
