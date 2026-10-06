import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS, Donut, characterUri } from "./ui";

export type ParticipantData = {
  id: string;
  name: string;
  isSelf: boolean;
  characterId: string | null;
  phase: "focus" | "break" | "idle";
  elapsedFraction: number;
  presence: "offline" | "typing" | "idle";
  recordsVisible: boolean;
  todayChars: number;
  position: "novelist" | "webtoon";
  workStatus: string | null;
  isOwner: boolean;
  isVice: boolean;
  lastSeenLabel: string | null;
};

const PHASE_COLOR = { focus: COLORS.focus, break: COLORS.break, idle: "#8a8a8a" } as const;
const PHASE_LABEL = { focus: "집중 중", break: "휴식 중", idle: "대기" } as const;

// 웹의 participant-card.tsx와 같은 구성 — 캐릭터, 진행 도넛, 방장 왕관, 이름·상태, 오늘 기록.
export function ParticipantCard({ data }: { data: ParticipantData }) {
  const offline = data.presence === "offline";
  const color = PHASE_COLOR[data.phase];
  const uri = characterUri(data.characterId);
  const unit = data.position === "webtoon" ? "컷" : "자";

  return (
    <View style={[styles.card, data.isSelf && styles.cardSelf]}>
      <View style={styles.photo}>
        {uri ? (
          <Image source={{ uri }} style={[styles.photoImg, offline && styles.offline]} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>🙂</Text>
        )}
        <View style={styles.donutWrap}>
          <Donut
            progress={offline ? 0 : data.elapsedFraction}
            color={offline ? "#d4d4d4" : color}
            size={34}
            strokeWidth={6}
          />
        </View>
        {(data.isOwner || data.isVice) && (
          <View style={styles.crown}>
            <Text style={{ fontSize: 12 }}>{data.isOwner ? "👑" : "✨"}</Text>
          </View>
        )}
        {data.presence === "typing" && (
          <View style={styles.typing}>
            <Text style={styles.typingText}>✍️</Text>
          </View>
        )}
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {data.name}
          {data.isSelf ? " (나)" : ""}
        </Text>
        {data.workStatus && !offline ? (
          <View style={styles.statusChip}>
            <Text style={styles.statusText}>{data.workStatus}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.chars}>
          {data.recordsVisible ? `${data.todayChars.toLocaleString()}${unit}` : "비공개"}
        </Text>
        {offline ? (
          <Text style={styles.faint}>{data.lastSeenLabel ? `${data.lastSeenLabel} 접속` : "접속 기록 없음"}</Text>
        ) : (
          <Text style={[styles.phase, { color }]}>{PHASE_LABEL[data.phase]}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: 10,
    gap: 6,
  },
  cardSelf: { borderColor: COLORS.text },
  photo: {
    aspectRatio: 4 / 3,
    backgroundColor: "#fafafa",
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoImg: { width: "100%", height: "100%" },
  offline: { opacity: 0.45 },
  placeholder: { fontSize: 28, color: "#d4d4d4" },
  donutWrap: {
    position: "absolute",
    left: 4,
    top: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 2,
  },
  crown: {
    position: "absolute",
    right: 4,
    top: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 3,
  },
  typing: {
    position: "absolute",
    right: 4,
    bottom: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  typingText: { fontSize: 11 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  name: { flexShrink: 1, fontSize: 13, fontWeight: "600", color: COLORS.text },
  statusChip: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusText: { fontSize: 10, color: COLORS.sub },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chars: { fontSize: 11, color: COLORS.sub },
  phase: { fontSize: 11, fontWeight: "600" },
  faint: { fontSize: 10, color: COLORS.faint },
});
