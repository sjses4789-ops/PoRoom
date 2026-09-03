"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// 참여자 카드에 "작업 중인 화면"을 픽셀이 깨진 모자이크처럼 보여주기
// 위한 캡처 크기/화질. 처음엔 160×90에 화질(quality)만 낮췄더니 카드
// 크기(약 240~300px 폭)로 늘렸을 때 배율이 1.5~2배 정도밖에 안 돼서
// JPEG 압축으로 인한 "흐릿함"에 가까웠다 — 진짜 "블록이 보이는" 느낌을
// 내려면 원본 해상도 자체를 아주 작게 잡아서(카드 폭 기준 한 칸이
// 6~8px는 되도록) 늘렸을 때 낱개 픽셀이 또렷한 색 블록으로 보이게 해야
// 한다. 해상도 자체가 이미 세부 내용을 다 지워버리므로, 화질(quality)은
// 오히려 높여서 블록 색이 추가로 뭉개지지 않고 선명하게 나오도록 한다.
const CAPTURE_WIDTH = 40;
const CAPTURE_HEIGHT = 22;
const CAPTURE_INTERVAL_MS = 2000;
const JPEG_QUALITY = 0.6;

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFrameRef = useRef(onFrame);
  const onStopRef = useRef(onStop);
  useEffect(() => {
    onFrameRef.current = onFrame;
    onStopRef.current = onStop;
  }, [onFrame, onStop]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: CAPTURE_WIDTH * 4 }, height: { ideal: CAPTURE_HEIGHT * 4 } },
        audio: false,
      });
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

    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d");

    const captureFrame = () => {
      if (!ctx || !videoRef.current || videoRef.current.readyState < 2) return;
      ctx.drawImage(videoRef.current, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      setPreviewUrl(dataUrl);
      onFrameRef.current(dataUrl);
    };

    // 참여자가 브라우저 자체의 "공유 중지" 버튼을 눌러도 여기서 감지해
    // 같은 정리 경로를 탄다.
    stream.getVideoTracks()[0]?.addEventListener("ended", stop);

    setIsSharing(true);
    captureFrame();
    intervalRef.current = setInterval(captureFrame, CAPTURE_INTERVAL_MS);
  }, [stop, t]);

  const toggle = useCallback(() => {
    if (isSharing) stop();
    else start();
  }, [isSharing, start, stop]);

  // 방을 나가거나 컴포넌트가 사라질 때 공유 중이던 스트림을 정리한다.
  useEffect(() => stop, [stop]);

  return { isSharing, previewUrl, toggle };
}
