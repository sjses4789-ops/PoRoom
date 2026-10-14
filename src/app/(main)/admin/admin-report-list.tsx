"use client";

import { useState } from "react";
import { deleteReport, setReportResolved } from "@/lib/safety";

export type AdminReport = {
  id: string;
  reportedName: string;
  reporterName: string;
  roomName: string | null;
  reason: string;
  createdAt: string;
  resolved: boolean;
  /** 메시지·사진 신고이면 신고 당시의 글 — 아니면 null. */
  messageContent: string | null;
  imageUrl: string | null;
  /** 사진이 있었는데 이미 지워져(보관 기간 지남 등) 못 보는 경우. */
  hadImage: boolean;
};

// 참여자 신고 목록 — 처리 완료 표시와 삭제를 할 수 있다. 계정 차단은 아래 "회원 목록"에서 한다.
export function AdminReportList({ reports: initial }: { reports: AdminReport[] }) {
  const [reports, setReports] = useState(initial);
  const [showResolved, setShowResolved] = useState(false);

  const visible = reports.filter((r) => showResolved || !r.resolved);
  const openCount = reports.filter((r) => !r.resolved).length;

  const toggle = async (r: AdminReport) => {
    setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, resolved: !x.resolved } : x)));
    await setReportResolved(r.id, !r.resolved);
  };
  const remove = async (r: AdminReport) => {
    if (!window.confirm("이 신고를 삭제할까요?")) return;
    setReports((prev) => prev.filter((x) => x.id !== r.id));
    await deleteReport(r.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>미처리 {openCount}건 / 전체 {reports.length}건</span>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          처리 완료도 보기
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="text-xs text-neutral-400">접수된 신고가 없습니다.</p>
      ) : (
        <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
          {visible.map((r) => (
            <li
              key={r.id}
              className={`flex flex-col gap-1.5 rounded-md border px-3 py-2.5 text-sm ${
                r.resolved
                  ? "border-neutral-200 opacity-60 dark:border-neutral-700"
                  : "border-red-200 dark:border-red-900"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-neutral-500">
                <span className="font-semibold text-neutral-900 dark:text-white">신고 대상: {r.reportedName}</span>
                <span>· 신고자: {r.reporterName}</span>
                {r.roomName && <span>· 방: {r.roomName}</span>}
                <span>· {new Date(r.createdAt).toLocaleString("ko-KR")}</span>
                {r.resolved && (
                  <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] dark:bg-neutral-800">처리 완료</span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                {r.reason}
              </p>
              {(r.messageContent || r.hadImage) && (
                <div className="flex flex-col gap-1.5 rounded-md bg-neutral-50 px-2.5 py-2 text-[12px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  <span className="text-[11px] font-medium text-neutral-400">신고된 메시지</span>
                  {r.messageContent && <span className="whitespace-pre-wrap">{r.messageContent}</span>}
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt="신고된 사진" className="max-h-48 max-w-full rounded object-contain" />
                  ) : (
                    r.hadImage && <span className="text-neutral-400">사진을 더 이상 볼 수 없어요(삭제됨).</span>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  className="rounded-md border border-neutral-200 px-2 py-1 text-[11px] text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {r.resolved ? "미처리로 되돌리기" : "처리 완료"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  className="rounded-md border border-neutral-200 px-2 py-1 text-[11px] text-red-500 transition hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
