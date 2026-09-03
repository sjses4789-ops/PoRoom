"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// 참여자 카드에 "작업 중인 화면"을 아주 흐릿하게만 보여주기 위한
// 캡처 크기/화질 — 텍스트나 세부 내용은 알아볼 수 없고, 색상과 움직임
// 정도만 전달되도록 일부러 낮게 잡았다. 실제 픽셀 수를 작게 캡처한 뒤
// 카드에서는 크게 늘려 그리므로(참여자 카드 쪽 CSS의 image-rendering:
// pixelated), 화면이 깨진 것처럼 보이는 효과가 자연스럽게 난다.
const CAPTURE_WIDTH = 160;
const CAPTURE_HEIGHT = 90;
const CAPTURE_INTERVAL_MS = 2000;
const JPEG_QUALITY = 0.35;

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
