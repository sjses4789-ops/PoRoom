// 뽀모도로 단계가 바뀔 때(집중 시작 / 휴식 시작) 다른 화면을 보고 있어도
// 알아챌 수 있도록 짧은 알림음을 재생한다. 오디오 파일 없이 Web Audio
// API로 톤을 직접 합성한다.
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  if (sharedContext.state === "suspended") void sharedContext.resume();
  return sharedContext;
}

function playTone(ctx: AudioContext, freq: number, startOffset: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const startTime = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// 집중 시작: 올라가는 2음 차임 — 활기찬 느낌.
export function playFocusStartChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 880, 0, 0.18);
  playTone(ctx, 1175, 0.16, 0.22);
}

// 휴식 시작: 내려가는 2음 차임 — 이완되는 느낌.
export function playBreakStartChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 700, 0, 0.18);
  playTone(ctx, 523, 0.16, 0.24);
}
