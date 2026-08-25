"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

const SEED_WORDS = [
  "사과", "구름", "바다", "하늘", "나무", "책상", "고양이", "강아지",
  "여행", "음악", "커피", "겨울", "봄날", "학교", "친구", "행복",
];

function pickSeed() {
  return SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)];
}

export function WordChain() {
  const t = useTranslations("rest.wordChain");
  const [chain, setChain] = useState<string[]>(() => [pickSeed()]);
  const [used, setUsed] = useState<Set<string>>(() => new Set());
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = chain[chain.length - 1];

  const reset = () => {
    const seed = pickSeed();
    setChain([seed]);
    setUsed(new Set());
    setInput("");
    setError(null);
    inputRef.current?.focus();
  };

  const submit = () => {
    const word = input.trim();
    if (word.length === 0) return;
    if (word.length < 2) {
      setError(t("errorTooShort"));
      return;
    }
    if (word[0] !== current[current.length - 1]) {
      setError(t("errorNotConnected", { char: current[current.length - 1] }));
      return;
    }
    if (used.has(word) || chain.includes(word)) {
      setError(t("errorAlreadyUsed"));
      return;
    }
    setChain((c) => [...c, word]);
    setUsed((s) => new Set(s).add(word));
    setInput("");
    setError(null);
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
            {t("chainCount", { count: chain.length })}
          </span>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {t("reset")}
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-sm leading-relaxed">
          {chain.map((w, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span
                className={
                  i === chain.length - 1
                    ? "rounded-full bg-neutral-900 px-3 py-1 font-semibold text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-500 dark:text-neutral-400"
                }
              >
                {w}
              </span>
              {i < chain.length - 1 && <span className="text-neutral-300 dark:text-neutral-600">→</span>}
            </span>
          ))}
        </div>

        <p className="text-center text-xs text-neutral-400">
          {t("nextHint", { char: current[current.length - 1] })}
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
