// 모바일 앱(mobile/)의 WebView 안에서 실행 중일 때만, 앱(네이티브)에 메시지를
// 보낸다. 일반 브라우저에서는 window.ReactNativeWebView가 없어서 아무 일도
// 하지 않는다 — 웹 코드가 앱 여부를 따로 분기할 필요가 없다.
declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

export type NativeMessage =
  | {
      type: "pomodoro";
      // 타이머가 돌고 있는지, 지금 단계의 남은 시간(초)과 설정값 — 앱이 이 값으로
      // "집중 끝/휴식 끝" 알림을 예약한다(WebView가 백그라운드에서 멈춰도 울리도록).
      running: boolean;
      phase: "focus" | "break";
      remainingSeconds: number;
      focusMinutes: number;
      breakMinutes: number;
      roomName: string | null;
    };

export function postToNative(message: NativeMessage) {
  if (typeof window === "undefined") return;
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}
