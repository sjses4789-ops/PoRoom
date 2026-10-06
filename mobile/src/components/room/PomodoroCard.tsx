import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePomodoro } from "../../lib/pomodoro";
import { formatClock } from "../../lib/time";
import { COLORS, Donut } from "./ui";

const STATUS = { idle: "대기", paused: "일시정지", focus: "집중 중", break: "휴식 중" } as const;

function Stepper({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepRow}>
        <Pressable
          style={[styles.stepBtn, disabled && styles.disabled]}
          disabled={disabled}
          onPress={() => onChange(Math.max(1, value - 5 >= 1 ? value - 5 : 1))}
          accessibilityLabel={`${label} 줄이기`}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}분</Text>
        <Pressable
          style={[styles.stepBtn, disabled && styles.disabled]}
          disabled={disabled}
          onPress={() => onChange(value + 5)}
          accessibilityLabel={`${label} 늘리기`}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// 웹의 PomodoroPanel과 같은 구성 — 도넛 진행률, 집중/휴식 시간 설정, 시작·일시정지·초기화.
export function PomodoroCard({ room }: { room: { id: string; name: string } }) {
  const p = usePomodoro();
  // 이 방이 현재 돌고 있는 타이머의 주인이 아니면 대기 상태로 보여준다("시작"을 누르는 순간 주인이 된다).
  const isActiveRoom = p.activeRoom?.id === room.id;
  const phase = isActiveRoom ? p.phase : "idle";
  const running = isActiveRoom && p.running;
  const started = isActiveRoom && p.started;
  const remaining = isActiveRoom ? p.remainingSeconds : p.focusMinutes * 60;
  const fraction = isActiveRoom ? p.elapsedFraction : 0;
  const color = phase === "break" ? COLORS.break : phase === "focus" ? COLORS.focus : COLORS.idle;
  const status = phase === "idle" ? STATUS.idle : !running ? STATUS.paused : STATUS[phase];

  return (
    <View style={styles.card}>
      <Donut
        progress={fraction}
        color={color}
        size={112}
        strokeWidth={14}
        label={formatClock(remaining)}
        subLabel={isActiveRoom && p.focusSessionCount > 0 ? `${p.focusSessionCount}회차` : undefined}
      />
      <View style={styles.right}>
        <Text style={[styles.status, { color: phase === "idle" ? COLORS.sub : color }]}>{status}</Text>
        <View style={styles.controls}>
          {!running ? (
            <Pressable style={styles.playBtn} onPress={() => p.start(room)} accessibilityLabel={started ? "재개" : "시작"}>
              <Text style={styles.playText}>▶</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.ghostBtn} onPress={p.pause} accessibilityLabel="일시정지">
              <Text style={styles.ghostText}>❚❚</Text>
            </Pressable>
          )}
          <Pressable style={styles.ghostBtn} onPress={p.reset} accessibilityLabel="초기화">
            <Text style={styles.ghostText}>↺</Text>
          </Pressable>
        </View>
        <View style={styles.steppers}>
          <Stepper label="집중" value={p.focusMinutes} disabled={started} onChange={p.setFocusMinutes} />
          <Stepper label="휴식" value={p.breakMinutes} disabled={started} onChange={p.setBreakMinutes} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: 14,
    backgroundColor: COLORS.card,
  },
  right: { flex: 1, gap: 8 },
  status: { fontSize: 13, fontWeight: "600" },
  controls: { flexDirection: "row", gap: 8 },
  playBtn: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },
  playText: { color: "#ffffff", fontSize: 14 },
  ghostBtn: {
    width: 40,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: { color: "#404040", fontSize: 14 },
  steppers: { flexDirection: "row", gap: 12 },
  stepper: { gap: 2 },
  stepLabel: { fontSize: 11, color: COLORS.sub },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontSize: 14, color: "#404040", lineHeight: 16 },
  stepValue: { fontSize: 13, color: COLORS.text, minWidth: 34, textAlign: "center" },
  disabled: { opacity: 0.35 },
});
