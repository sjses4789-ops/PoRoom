import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { WEB_URL } from "../../lib/config";

export const COLORS = {
  brand: "#c17b7b",
  focus: "#c17b7b",
  break: "#7b93c1",
  idle: "#d4d4d4",
  text: "#171717",
  sub: "#737373",
  faint: "#a3a3a3",
  line: "#e5e5e5",
  card: "#ffffff",
  soft: "#f5f5f5",
};

export function characterUri(characterId: string | null) {
  return characterId ? `${WEB_URL}/characters/${characterId}.png` : null;
}

export function Avatar({ characterId, size = 36 }: { characterId: string | null; size?: number }) {
  const uri = characterUri(characterId);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>🙂</Text>
      )}
    </View>
  );
}

// 웹의 PomodoroDonut과 같은 모양 — 진행률만큼 원이 채워진다.
export function Donut({
  progress,
  color,
  size,
  strokeWidth,
  label,
  subLabel,
}: {
  progress: number;
  color: string;
  size: number;
  strokeWidth: number;
  label?: string;
  subLabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#efefef" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${c * clamped} ${c}`}
          strokeLinecap="butt"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {label !== undefined && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.donutCenter}>
            <Text style={[styles.donutLabel, { fontSize: size * 0.2 }]}>{label}</Text>
            {subLabel ? <Text style={styles.donutSub}>{subLabel}</Text> : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  donutLabel: { fontWeight: "600", color: COLORS.text, fontVariant: ["tabular-nums"] },
  donutSub: { fontSize: 11, color: COLORS.sub, marginTop: 2 },
});
