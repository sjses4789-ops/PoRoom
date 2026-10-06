import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { rpc } from "../../lib/api";
import { effectiveRecordDate } from "../../lib/time";
import { COLORS } from "./ui";

type Work = { id: string; title: string; lastCurrentChars: number };

// 웹의 CharInput과 같은 규칙 — 웹소설 작가는 작품을 고르고 "현재 글자수"를 넣으면 이전 값과의
// 차이(델타)가 오늘 기록에 더해지고, 웹툰 작가는 오늘 작업한 컷 수를 바로 더한다. 저장은 웹과 같은
// 서버 로직(recordChars / recordWorkChars)으로 한다.
export function CharInputCard({
  roomId,
  position,
  todayChars,
  onAdded,
  onActivity,
}: {
  roomId: string;
  position: "novelist" | "webtoon";
  todayChars: number;
  onAdded: (delta: number) => void;
  onActivity: () => void;
}) {
  const isWebtoon = position === "webtoon";
  const unit = isWebtoon ? "컷" : "자";
  const [works, setWorks] = useState<Work[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [current, setCurrent] = useState("");
  const [cuts, setCuts] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadWorks = useCallback(async () => {
    const list = await rpc<Work[]>("getMyWorks");
    setWorks(list ?? []);
  }, []);

  useEffect(() => {
    if (isWebtoon) return;
    // 마운트 시 내 작품 목록을 서버에서 한 번 가져온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWorks();
  }, [isWebtoon, loadWorks]);

  const active = works.find((w) => w.id === activeId) ?? null;
  const baseline = active?.lastCurrentChars ?? 0;
  const currentNum = current.trim() === "" ? baseline : Number(current.replace(/,/g, "")) || 0;
  const delta = currentNum - baseline;

  const saveNovel = async () => {
    if (!active || delta === 0 || busy) return;
    setBusy(true);
    const date = effectiveRecordDate(Date.now());
    await rpc("recordChars", roomId, delta, date);
    await rpc("recordWorkChars", active.id, delta, currentNum, date);
    setWorks((prev) => prev.map((w) => (w.id === active.id ? { ...w, lastCurrentChars: currentNum } : w)));
    setCurrent("");
    setBusy(false);
    onAdded(delta);
  };

  const saveCuts = async () => {
    const n = Math.max(0, Math.floor(Number(cuts)) || 0);
    if (n <= 0 || busy) return;
    setBusy(true);
    await rpc("recordChars", roomId, n, effectiveRecordDate(Date.now()));
    setCuts("");
    setBusy(false);
    onAdded(n);
  };

  const addWork = async () => {
    const title = newTitle.trim();
    if (!title || busy) return;
    setBusy(true);
    const created = await rpc<{ id: string; title: string } | { error: string }>("createWork", title);
    setBusy(false);
    if (!created || "error" in created) {
      Alert.alert("작품을 추가하지 못했어요", created && "error" in created ? created.error : "잠시 후 다시 시도해 주세요.");
      return;
    }
    const work: Work = { id: created.id, title: created.title, lastCurrentChars: 0 };
    setWorks((prev) => [...prev, work]);
    setActiveId(work.id);
    setNewTitle("");
    setAdding(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>오늘의 {isWebtoon ? "컷수" : "글자수"}</Text>
        <Text style={styles.todayValue}>
          {todayChars.toLocaleString()}
          <Text style={styles.todayUnit}> {unit}</Text>
        </Text>
      </View>

      {isWebtoon ? (
        <View style={styles.card}>
          <Text style={styles.heading}>오늘 작업한 컷 수 추가</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              value={cuts}
              onChangeText={(t) => {
                setCuts(t.replace(/[^0-9]/g, ""));
                onActivity();
              }}
              keyboardType="number-pad"
              placeholder="예: 5"
              placeholderTextColor={COLORS.faint}
            />
            <Pressable style={[styles.btn, (!cuts || busy) && styles.disabled]} onPress={saveCuts}>
              <Text style={styles.btnText}>추가</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.heading}>작품 선택</Text>
          <View style={styles.chips}>
            {works.map((w) => (
              <Pressable
                key={w.id}
                style={[styles.chip, w.id === activeId && styles.chipActive]}
                onPress={() => {
                  setActiveId(w.id);
                  setCurrent("");
                }}
              >
                <Text style={[styles.chipText, w.id === activeId && styles.chipTextActive]}>{w.title}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.chipAdd} onPress={() => setAdding((v) => !v)}>
              <Text style={styles.chipText}>＋ 작품 추가</Text>
            </Pressable>
          </View>

          {adding && (
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="작품 이름"
                placeholderTextColor={COLORS.faint}
              />
              <Pressable style={[styles.btn, (!newTitle.trim() || busy) && styles.disabled]} onPress={addWork}>
                <Text style={styles.btnText}>추가</Text>
              </Pressable>
            </View>
          )}

          {active ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.hint}>이전 기록: {baseline.toLocaleString()}자</Text>
              <TextInput
                style={styles.input}
                value={current}
                onChangeText={(t) => {
                  setCurrent(t.replace(/[^0-9]/g, ""));
                  onActivity();
                }}
                keyboardType="number-pad"
                placeholder="현재 글자수"
                placeholderTextColor={COLORS.faint}
              />
              <View style={styles.deltaRow}>
                <Text style={styles.hint}>
                  변화량{" "}
                  <Text style={[styles.delta, delta < 0 && styles.deltaNeg]}>
                    {delta > 0 ? "+" : ""}
                    {delta.toLocaleString()}자
                  </Text>
                </Text>
                <Pressable style={[styles.btn, (delta === 0 || busy) && styles.disabled]} onPress={saveNovel}>
                  <Text style={styles.btnText}>기록</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.hint}>작품을 고르면 글자수를 기록할 수 있어요.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 12, gap: 12 },
  todayCard: {
    alignItems: "center",
    backgroundColor: COLORS.soft,
    borderRadius: 8,
    paddingVertical: 18,
    gap: 4,
  },
  todayLabel: { fontSize: 13, color: COLORS.sub },
  todayValue: { fontSize: 30, fontWeight: "700", color: COLORS.text },
  todayUnit: { fontSize: 14, fontWeight: "500", color: COLORS.sub },
  card: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 4, padding: 14, gap: 10, backgroundColor: COLORS.card },
  heading: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  row: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: COLORS.text,
  },
  btn: { backgroundColor: COLORS.text, borderRadius: 8, paddingHorizontal: 18, justifyContent: "center", paddingVertical: 9 },
  btnText: { color: "#ffffff", fontWeight: "600" },
  disabled: { opacity: 0.35 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  chipAdd: { borderWidth: 1, borderColor: COLORS.line, borderStyle: "dashed", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, color: "#404040" },
  chipTextActive: { color: "#ffffff" },
  hint: { fontSize: 12, color: COLORS.sub },
  deltaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  delta: { fontWeight: "700", color: "#15803d" },
  deltaNeg: { color: "#b91c1c" },
});
