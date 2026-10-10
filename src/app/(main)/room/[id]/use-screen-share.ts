"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// 참여자 카드에 "작업 중인 화면"을 픽셀이 깨진 모자이크처럼 보여주기
// 위한 캡처 크기/화질. 처음엔 160×90에 화질(quality)만 낮췄더니 카드
// 크기(약 240~300px 폭)로 늘렸을 때 배율이 1.5~2배 정도밖에 안 돼서
// JPEG 압축으로 인한 "흐릿함"에 가까웠다 — 진짜 "블록이 보이는" 느낌을
// 내려면 원본 해상도 자체를 아주 작게 잡아서 늘렸을 때 낱개 픽셀이
// 또렷한 색 블록으로 보이게 해야 한다. 해상도 자체가 이미 세부 내용을
// 다 지워버리므로, 화질(quality)은 오히려 높여서 블록 색이 추가로
// 뭉개지지 않고 선명하게 나오도록 한다.
//
// 캡처 폭·높이를 고정값으로 두면 공유한 창의 실제 비율(가로로 넓은
// 창이든 세로로 긴 창이든)과 달라 이미지가 눌리거나 늘어나 보인다 —
// 그래서 긴 변 기준 칸 수(TARGET_CELLS)만 고정하고, 공유 시작 시
// 트랙의 실제 가로세로 비율을 읽어 짧은 변 칸 수를 그 비율에 맞게
// 계산한다(computeCaptureSize).
// 22칸에서 40칸으로 올렸다: 글 내용은 읽을 수 없는 블록 크기(1920px 화면 기준 칸당 약 34px)를 유지하면서,
// 타이핑으로 글이 늘어날 때 그 부분의 색 농도가 바뀌는 것이 보일 만큼만 더 잘게 나눈다.
const TARGET_CELLS_LONG_SIDE = 56;
const CAPTURE_INTERVAL_MS = 2000;
const JPEG_QUALITY = 0.7;

// 공유 중에는 방 탭이 보통 백그라운드(집필 프로그램이 앞)에 있는데, 브라우저는 숨겨진 탭의
// setInterval을 1초 단위로, 5분쯤 지나면 분 단위로까지 늦춘다 — 그러면 프레임이 몇 초~1분에
// 한 번만 나가서 보는 쪽이 "공유가 끊겼다"고 보고 화면을 지워 버린다. 웹 워커의 타이머는 이
// 제한을 받지 않으므로, 박자는 워커가 세고 캡처는 그 신호를 받아 메인 스레드에서 한다.
function startTicker(ms: number, onTick: () => void): () => void {
  try {
    const url = URL.createObjectURL(
      new Blob([`setInterval(function(){postMessage(0)},${ms})`], { type: "text/javascript" })
    );
    const worker = new Worker(url);
    worker.onmessage = onTick;
    return () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    };
  } catch {
    const id = setInterval(onTick, ms);
    return () => clearInterval(id);
  }
}

function computeCaptureSize(srcWidth: number, srcHeight: number): { width: number; height: number } {
  const aspect = (srcWidth || 16) / (srcHeight || 9);
  return aspect >= 1
    ? { width: TARGET_CELLS_LONG_SIDE, height: Math.max(1, Math.round(TARGET_CELLS_LONG_SIDE / aspect)) }
    : { width: Math.max(1, Math.round(TARGET_CELLS_LONG_SIDE * aspect)), height: TARGET_CELLS_LONG_SIDE };
}

// 화면/창 공유를 시작·중지하고, 주기적으로 저해상도 프레임을 캡처해
// onFrame으로 넘겨준다(실제 브로드캐스트는 호출부 책임 — 이 훅은 캡처만
// 담당). onStop은 사용자가 브라우저 자체 "공유 중지" 바를 눌러 트랙이
// 끊겼을 때도 불린다.
export function useScreenShare(onFrame: (dataUrl: string) => void, onStop: () => void) {
  const t = useTranslations("room.participantCard");
  const [isSharing, setIsSharing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stopTickerRef = useRef<(() => void) | null>(null);
  const onFrameRef = useRef(onFrame);
  const onStopRef = useRef(onStop);
  useEffect(() => {
    onFrameRef.current = onFrame;
    onStopRef.current = onStop;
  }, [onFrame, onStop]);

  const stop = useCallback(() => {
    stopTickerRef.current?.();
    stopTickerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    videoRef.current = null;
    setPreviewUrl(null);
    setIsSharing((prev) => {
      if (prev) onStopRef.current();
      return false;
    });
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      window.alert(t("shareUnsupported"));
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    } catch {
      // 선택 창에서 취소했거나 권한을 거부한 경우 — 조용히 무시.
      return;
    }

    streamRef.current = stream;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    videoRef.current = video;
    try {
      await video.play();
    } catch {
      // 일부 브라우저는 자동재생을 막기도 하지만, 캡처 자체는 프레임이
      // 준비되는 대로 계속 시도하면 되므로 여기서 중단하지 않는다.
    }

    const videoTrack = stream.getVideoTracks()[0];
    const initial = videoTrack?.getSettings();
    const initialSize = computeCaptureSize(initial?.width ?? 16, initial?.height ?? 9);

    const canvas = document.createElement("canvas");
    canvas.width = initialSize.width;
    canvas.height = initialSize.height;
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d");
    // 큰 화면을 작은 캔버스로 줄일 때 고품질 보간을 써야 칸 안의 글자 밀도가 평균 색으로 반영된다
    // (기본값은 일부 픽셀만 건너뛰어 뽑아 글이 늘어나도 변화가 안 보일 수 있다).
    if (ctx) ctx.imageSmoothingQuality = "high";

    const captureFrame = () => {
      if (!ctx || !videoRef.current || videoRef.current.readyState < 2) return;
      // 공유 중 창 크기를 바꾸면 비율이 달라지므로, 매 프레임 실제 영상 크기를 읽어 캔버스 비율을
      // 맞춘다 — 고정 크기에 그리면 화면이 눌리거나 늘어난다.
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth > 0 && videoHeight > 0) {
        const size = computeCaptureSize(videoWidth, videoHeight);
        if (canvas.width !== size.width || canvas.height !== size.height) {
          canvas.width = size.width;
          canvas.height = size.height;
          ctx.imageSmoothingQuality = "high";
        }
      }
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      setPreviewUrl(dataUrl);
      onFrameRef.current(dataUrl);
    };

    // 참여자가 브라우저 자체의 "공유 중지" 버튼을 눌러도 여기서 감지해
    // 같은 정리 경로를 탄다.
    videoTrack?.addEventListener("ended", stop);

    setIsSharing(true);
    captureFrame();
    stopTickerRef.current = startTicker(CAPTURE_INTERVAL_MS, captureFrame);
  }, [stop, t]);

  const toggle = useCallback(() => {
    if (isSharing) stop();
    else start();
  }, [isSharing, start, stop]);

  // 방을 나가거나 컴포넌트가 사라질 때 공유 중이던 스트림을 정리한다.
  useEffect(() => stop, [stop]);

  return { isSharing, previewUrl, toggle };
}
