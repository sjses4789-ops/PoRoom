"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

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

// 두 글자~네 글자 단어 풀 — 사전 검증은 하지 않고, 여기 담긴 단어의
// 초성과 입력값의 초성이 같은지만 비교한다.
const WORD_POOL = [
  "사과", "구름", "바다", "하늘", "나무", "책상", "여행", "음악",
  "커피", "겨울", "봄날", "학교", "친구", "행복", "시계", "우산",
  "창문", "거울", "편지", "노래",
  "강아지", "고양이", "도서관", "놀이터", "우체국", "병아리",
  "손수건", "무지개", "자전거", "초콜릿", "대통령", "라디오",
  "컴퓨터", "냉장고",
  "대한민국", "자원봉사", "국제공항", "텔레비전", "한국음식",
];

function pickWord(exclude?: string) {
  const pool = exclude ? WORD_POOL.filter((w) => w !== exclude) : WORD_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function ChoseongQuiz() {
  const t = useTranslations("rest.choseong");
  const [word, setWord] = useState(() => pickWord());
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [justCorrect, setJustCorrect] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quiz = choseongOf(word);

  const nextWord = () => {
    const next = pickWord(word);
    setWord(next);
    setInput("");
    setError(null);
  };

  const reset = () => {
    setCorrectCount(0);
    setJustCorrect(null);
    nextWord();
    inputRef.current?.focus();
  };

  const submit = () => {
    const guess = input.trim();
    if (guess.length === 0) return;
    if (choseongOf(guess) === quiz && guess.length === word.length) {
      setJustCorrect(word);
      setCorrectCount((c) => c + 1);
      nextWord();
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

        <p className="text-center text-3xl font-bold tracking-[0.3em] text-neutral-900 dark:text-white">
          {quiz}
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
            autoFocus
            placeholder={t("inputPlaceholder")}
            className="min-w-0 flex-1 rounded-sm border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600 dark:border-neutral-600 dark:text-white dark:focus:border-neutral-400"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-sm bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {t("submit")}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
