"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { decomposeChar } from "@/lib/hangul";
import { pickRandomSentence } from "@/lib/typing-sentences";
import { submitTypingScore } from "@/lib/rest";
import { KeyboardView } from "./keyboard-view";

export function TypingPractice({ myBestCpm }: { myBestCpm: number | null }) {
  const t = useTranslations("rest.typing");
  const [sentence, setSentence] = useState(() => pickRandomSentence());
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<{ cpm: number; accuracy: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [bestCpm, setBestCpm] = useState(myBestCpm);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  const finished = input === sentence;

  useEffect(() => {
    if (!finished || startedAt === null || submittedRef.current) return;
    submittedRef.current = true;
    const elapsedMinutes = Math.max((Date.now() - startedAt) / 60000, 1 / 60);
    const cpm = Math.round(sentence.length / elapsedMinutes);
    const accuracy = Math.max(
      0,
      Math.round(((sentence.length - mistakes) / sentence.length) * 100)
    );
    setResult({ cpm, accuracy });
    setPending(true);
    submitTypingScore(cpm, accuracy).then((res) => {
      setPending(false);
      if (res && "ok" in res) {
        setBestCpm((prev) => (prev === null ? cpm : Math.max(prev, cpm)));
      }
    });
  }, [finished, sentence, startedAt, mistakes]);

  const nextSentence = () => {
    setSentence(pickRandomSentence(sentence));
    setInput("");
    setStartedAt(null);
    setMistakes(0);
    setResult(null);
    submittedRef.current = false;
    inputRef.current?.focus();
  };

  const onChange = (value: string) => {
    if (finished) return;
    if (value.length > sentence.length) return;
    if (startedAt === null && value.length > 0) setStartedAt(Date.now());
    if (value.length > input.length) {
      const nextChar = value[value.length - 1];
      const expectedChar = sentence[value.length - 1];
      if (nextChar !== expectedChar) setMistakes((m) => m + 1);
    }
    setInput(value);
  };

  const nextCharKeys = !finished && input.length < sentence.length
    ? decomposeChar(sentence[input.length])
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
        <span className="text-xs text-neutral-400">
          {bestCpm !== null ? t("myBest", { cpm: bestCpm }) : t("noBestYet")}
        </span>
      </div>

      <div
        className="rounded-sm border border-neutral-400 p-5 text-center text-lg leading-relaxed tracking-wide dark:border-neutral-600"
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

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        disabled={finished}
        autoFocus
        placeholder={t("inputPlaceholder")}
        className="rounded-sm border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-600 disabled:opacity-50 dark:border-neutral-600 dark:text-white dark:focus:border-neutral-400"
      />

      {result ? (
        <div className="flex flex-col items-center gap-2 rounded-sm border border-neutral-400 p-4 text-center dark:border-neutral-600">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {pending ? t("saving") : t("resultSaved")}
          </p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
            {t("cpmValue", { cpm: result.cpm })}
          </p>
          <p className="text-xs text-neutral-400">{t("accuracyValue", { accuracy: result.accuracy })}</p>
          <button
            onClick={nextSentence}
            className="mt-2 rounded-sm bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {t("nextSentence")}
          </button>
        </div>
      ) : (
        <KeyboardView activeKeys={nextCharKeys} />
      )}
    </div>
  );
}
