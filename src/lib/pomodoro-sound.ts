// 뽀모도로 단계가 바뀔 때(집중 시작 / 휴식 시작) 다른 화면을 보고 있어도
// 알아챌 수 있도록 짧은 알림음을 재생한다. 오디오 파일 없이 Web Audio
// API로 톤을 직접 합성한다.
let sharedContext: AudioContext | null = null;

const BASE_GAIN = 0.22;
const LOUDER_GAIN = BASE_GAIN * 1.2; // 요청대로 기존 대비 20% 더 크게.

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

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  peakGain: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const startTime = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// 집중 시작(및 휴식→집중 전환): 올라가는 2음 차임을 약 2초 동안 세 번
// 반복해서, 휴식 중이던 참여자가 놓치지 않고 알아챌 수 있게 한다.
// 기존 대비 소리 크기도 20% 키웠다.
export function playFocusStartChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const pulseSpacing = 0.75;
  for (let i = 0; i < 3; i++) {
    const base = i * pulseSpacing;
    playTone(ctx, 880, base, 0.18, LOUDER_GAIN);
    playTone(ctx, 1175, base + 0.16, 0.22, LOUDER_GAIN);
  }
}

// 휴식 시작: 내려가는 2음 차임 — 집중이 자연스럽게 풀리도록, 기존 대비
// 소리 크기를 20% 키웠다(길이는 그대로).
export function playBreakStartChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, 700, 0, 0.18, LOUDER_GAIN);
  playTone(ctx, 523, 0.16, 0.24, LOUDER_GAIN);
}
