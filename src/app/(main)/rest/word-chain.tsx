"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

const SEED_WORDS = [
  "사과", "구름", "바다", "하늘", "나무", "책상", "고양이", "강아지",
  "여행", "음악", "커피", "겨울", "봄날", "학교", "친구", "행복",
];

function pickSeed(exclude?: string) {
  const pool = exclude ? SEED_WORDS.filter((w) => w !== exclude) : SEED_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function decomposeHangul(ch: string): { cho: number; jung: number; jong: number } | null {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  const jong = code % 28;
  const jung = ((code - jong) / 28) % 21;
  const cho = Math.floor((code - jong) / 28 / 21);
  return { cho, jung, jong };
}

function composeHangul(cho: number, jung: number, jong: number): string {
  return String.fromCharCode(0xac00 + (cho * 21 + jung) * 28 + jong);
}

// 두음법칙: 단어 첫머리의 한자음 "라랴러려례로료루류르리" 등은 "나냐너녀녜노뇨누뉴느니"로,
// "냐녀녜뇨뉴니"·"랴려례료류리"는 "야여예요유이"로 바뀐다 — ㄹ/ㄴ이 초성일 때
// 뒤따르는 모음에 따라 ㄴ 또는 ㅇ으로 변한다.
const DUEUM_TO_IEUNG_VOWELS = new Set([2, 6, 7, 12, 17, 20]); // 야여예요유이
const DUEUM_TO_NIEUN_VOWELS = new Set([0, 1, 8, 11, 13, 18]); // 아애오외우으

function dueumForm(ch: string): string {
  const d = decomposeHangul(ch);
  if (!d) return ch;
  if (d.cho === 5) {
    if (DUEUM_TO_IEUNG_VOWELS.has(d.jung)) return composeHangul(11, d.jung, d.jong);
    if (DUEUM_TO_NIEUN_VOWELS.has(d.jung)) return composeHangul(2, d.jung, d.jong);
  } else if (d.cho === 2 && DUEUM_TO_IEUNG_VOWELS.has(d.jung)) {
    return composeHangul(11, d.jung, d.jong);
  }
  return ch;
}

export function WordChain() {
  const t = useTranslations("rest.wordChain");
  const [chain, setChain] = useState<string[]>(() => [pickSeed()]);
  const [used, setUsed] = useState<Set<string>>(() => new Set());
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = chain[chain.length - 1];
  const lastChar = current[current.length - 1];
  const lastCharAlt = dueumForm(lastChar);
  const hintChar = lastCharAlt !== lastChar ? `${lastChar}/${lastCharAlt}` : lastChar;

  const reset = () => {
    // 처음 시작했던 단어가 다시 나오지 않도록, 방금 전 시작 단어는 제외한다.
    const seed = pickSeed(chain[0]);
    setChain([seed]);
    setUsed(new Set());
    setInput("");
    setError(null);
    setFailed(false);
    inputRef.current?.focus();
  };

  const submit = () => {
    const word = input.trim();
    if (word.length === 0) return;
    if (word.length < 2) {
      setError(t("errorTooShort"));
      return;
    }
    if (word[0] !== lastChar && word[0] !== lastCharAlt) {
      setError(t("errorNotConnected", { char: hintChar }));
      return;
    }
    if (used.has(word) || chain.includes(word)) {
      // 이미 쓴 단어를 다시 내면 실패 — 새 시작 단어로 초기화한다.
      const seed = pickSeed(chain[0]);
      setChain([seed]);
      setUsed(new Set());
      setInput("");
      setError(null);
      setFailed(true);
      return;
    }
    setChain((c) => [...c, word]);
    setUsed((s) => new Set(s).add(word));
    setInput("");
    setError(null);
    setFailed(false);
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

        {failed && (
          <p className="mb-3 text-center text-sm font-semibold text-red-600">{t("failedRestart")}</p>
        )}

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
          {t("nextHint", { char: hintChar })}
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
