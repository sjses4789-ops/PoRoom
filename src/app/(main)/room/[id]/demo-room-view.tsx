"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ParticipantCard, type ParticipantData } from "./participant-card";
import { PomodoroPanel } from "./pomodoro-panel";
import { paletteDot } from "@/lib/palette";
import { characterSrc } from "@/lib/characters";
import type { DemoRoomDetail } from "@/lib/demo-data";

const noop = () => {};

// 애드센스 심사 기간 동안 비로그인 방문자에게 보여주는 "예시 방" 화면.
// 실제 방(RoomView)과 달리 실시간 구독·기록 저장·채팅 전송 같은 부작용이
// 전혀 없는 읽기 전용 화면이라, 방 구성(채팅 / 참여자 / 뽀모도로 / 게시판)을
// 구경만 할 수 있다 — 실제 방에 들어가려면 로그인해야 한다.
export function DemoRoomView({ detail }: { detail: DemoRoomDetail }) {
  const t = useTranslations("room.demo");
  const tView = useTranslations("room.roomView");
  const tPage = useTranslations("room.page");
  const { room, members, messages, posts } = detail;

  const participants: ParticipantData[] = members
    .map((m) => ({
      id: m.id,
      name: m.name,
      characterId: m.characterId,
      phase: m.phase,
      focusMinutes: 25,
      breakMinutes: 5,
      elapsedFraction: m.elapsedFraction,
      accumulatedFocusMinutes: m.focusMinutes,
      accumulatedChars: m.todayChars,
      presence: m.presence,
      recordsVisible: true,
      lastSeenLabel: m.lastSeenLabel,
      workStatus: m.workStatus,
      position: m.position,
      isOwner: m.isOwner,
      isVice: false,
    }))
    .sort((a, b) => Number(a.presence === "offline") - Number(b.presence === "offline"));

  const onlineCount = participants.filter((p) => p.presence !== "offline").length;
  const characterById = new Map(members.map((m) => [m.id, m.characterId]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/main" className="text-xs text-neutral-400 hover:underline">
            {tPage("backToPoroom")}
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${paletteDot(room.color)}`} />
            {room.name}
            <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[11px] font-normal text-neutral-500 dark:border-neutral-600 dark:text-neutral-400">
              {t("sample")}
            </span>
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-[#faf3f3] px-4 py-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-[#231a1a] dark:text-neutral-200">
        <span>{t("banner")}</span>
        <Link
          href="/login"
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700"
        >
          {t("login")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr_260px]">
        {/* 채팅 */}
        <div className="flex h-[28rem] flex-col overflow-hidden rounded-sm border border-neutral-400 dark:border-neutral-600 lg:order-1 lg:h-auto lg:min-h-[28rem]">
          <div className="border-b border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-900 dark:border-neutral-700 dark:text-white">
            {t("chatHeading")}
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            {messages.map((m) => {
              const src = characterSrc(characterById.get(m.userId));
              return (
                <div key={m.id} className="flex items-start gap-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                    {src && <Image src={src} alt="" fill sizes="32px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[12px] text-neutral-500 dark:text-neutral-400">{m.name}</span>
                    <p className="w-fit max-w-full break-words rounded-lg bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                      {m.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-neutral-200 p-2 dark:border-neutral-700">
            <input
              disabled
              placeholder={t("chatDisabled")}
              className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
        </div>

        {/* 참여자 */}
        <div className="flex flex-col gap-3 lg:order-2">
          <div className="flex items-center gap-2 overflow-hidden rounded-sm border border-neutral-400 px-3 py-2 dark:border-neutral-600">
            <span aria-hidden className="text-neutral-400">
              👥
            </span>
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              {tView("participantsList")}
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-sm font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {tView("membersSuffix", { count: members.length, capacity: members.length })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
            {participants.map((p) => (
              <ParticipantCard key={p.id} data={p} />
            ))}
          </div>
          <p className="text-[12px] text-neutral-400">{tView("onlineCount", { count: onlineCount })}</p>
        </div>

        {/* 뽀모도로 */}
        <div className="flex flex-col gap-3 lg:order-3">
          <div className="pointer-events-none opacity-90">
            <PomodoroPanel
              phase="focus"
              running
              remainingSeconds={14 * 60 + 32}
              elapsedFraction={0.42}
              focusMinutes={25}
              breakMinutes={5}
              focusSessionCount={2}
              onChangeFocus={noop}
              onChangeBreak={noop}
              started
              start={noop}
              pause={noop}
              reset={noop}
            />
          </div>
          <p className="text-[12px] text-neutral-400">{t("pomodoroHint")}</p>
        </div>
      </div>

      {/* 방 게시판 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">{t("boardHeading")}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {posts.map((p) => (
            <article
              key={p.id}
              className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
            >
              <div className="flex items-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">{p.category}</span>
                {p.pinned && <span className="text-amber-600 dark:text-amber-400">📌 {t("pinned")}</span>}
              </div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white">{p.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{p.content}</p>
              <span className="mt-auto text-[12px] text-neutral-400">{p.authorName}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
