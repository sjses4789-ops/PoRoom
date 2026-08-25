"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CHOSEONG_WORDS } from "@/lib/choseong-words";

const CHOSEONG_LIST = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

function choseongOfChar(ch: string): string {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return ch;
  return CHOSEONG_LIST[Math.floor(code / (21 * 28))];
}

function choseongOf(word: string): string {
  return Array.from(word).map(choseongOfChar).join("");
}

function pickEntry(exclude?: string): [string, string] {
  const pool = exclude ? CHOSEONG_WORDS.filter(([w]) => w !== exclude) : CHOSEONG_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function ChoseongQuiz() {
  const t = useTranslations("rest.choseong");
  const [[word, meaning], setEntry] = useState<[string, string]>(() => pickEntry());
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [justCorrect, setJustCorrect] = useState<string | null>(null);
  // 초성은 맞았지만 정확한 단어가 아닐 때: 오답으로 처리하고 정답을
  // 공개한 채로 멈춰 있다가, 한 번 더 엔터(또는 제출)를 누르면 다음
  // 문제로 넘어간다.
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quiz = choseongOf(word);

  const nextWord = useCallback(() => {
    setEntry(pickEntry(word));
    setInput("");
    setError(null);
    setRevealed(false);
  }, [word]);

  const reset = () => {
    setCorrectCount(0);
    setJustCorrect(null);
    nextWord();
    inputRef.current?.focus();
  };

  const submit = () => {
    if (revealed) {
      nextWord();
      return;
    }

    const guess = input.trim();
    if (guess.length === 0) return;

    // 정확한 정답일 때만 정답으로 센다.
    if (guess === word) {
      setJustCorrect(word);
      setCorrectCount((c) => c + 1);
      nextWord();
      return;
    }
    // 초성만 맞고 단어가 다르면 오답 처리 — 정답을 공개하고 다음 엔터를
    // 기다린다.
    if (guess.length === word.length && choseongOf(guess) === quiz) {
      setRevealed(true);
      setError(null);
      return;
    }
    setError(t("wrong"));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{t("hint")}</span>
      </div>

      <div className="rounded-sm border border-neutral-400 p-5 dark:border-neutral-600">
        <div className="mb-3 flex items-center justify-center gap-4 text-xs">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">
            {t("correctCount", { count: correctCount })}
          </span>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {t("reset")}
          </button>
        </div>

        {justCorrect && (
          <p className="mb-3 text-center text-sm font-semibold text-emerald-600">
            {t("correctReveal", { word: justCorrect })}
          </p>
        )}
        {revealed && (
          <p className="mb-3 text-center text-sm font-semibold text-red-600">
            {t("failedReveal")}
          </p>
        )}

        {revealed ? (
          <p className="mx-auto mb-3 max-w-md text-center text-2xl font-bold text-red-500">✕</p>
        ) : (
          <p className="mx-auto mb-3 max-w-md text-center text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {meaning}
          </p>
        )}

        <p
          className={`text-center text-3xl font-bold tracking-[0.3em] ${
            revealed ? "text-red-500" : "text-neutral-900 dark:text-white"
          }`}
        >
          {revealed ? word : quiz}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
              setJustCorrect(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            readOnly={revealed}
            autoFocus
            placeholder={revealed ? t("pressEnterNext") : t("inputPlaceholder")}
            className="min-w-0 flex-1 rounded-sm border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600 dark:border-neutral-600 dark:text-white dark:focus:border-neutral-400"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-sm bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {revealed ? t("next") : t("submit")}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
