import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ParticipantCard, type ParticipantData } from "../components/room/ParticipantCard";
import { PomodoroCard } from "../components/room/PomodoroCard";
import { ChatView } from "../components/room/ChatView";
import { CharInputCard } from "../components/room/CharInputCard";
import { COLORS } from "../components/room/ui";
import type { ChatMessage } from "../lib/use-room-chat";
import type { RoomMember } from "../lib/use-room-data";

// 개발용 미리보기 — 네트워크·로그인 없이 방 화면의 레이아웃만 확인한다.
// POROOM_PREVIEW=1 로 빌드한 앱에서만 열리고, 일반 빌드에서는 홈으로 돌려보낸다.
const enabled = (Constants.expoConfig?.extra as { preview?: boolean } | undefined)?.preview === true;

const names = ["밤새는작가", "문장수집가", "라떼한잔", "콘티왕", "채색요정", "달빛서재"];
const phases = ["focus", "break", "focus", "focus", "idle", "idle"] as const;

const MEMBERS: ParticipantData[] = names.map((name, i) => ({
  id: `m${i}`,
  name,
  isSelf: i === 0,
  characterId: `char_${String(3 + i * 5).padStart(4, "0")}`,
  phase: i === 5 ? "idle" : phases[i],
  elapsedFraction: [0.42, 0.7, 0.15, 0.88, 0, 0][i],
  presence: i < 3 ? (i === 1 ? "typing" : "idle") : "offline",
  recordsVisible: true,
  todayChars: [1930, 2250, 1700, 5, 0, 3470][i],
  position: i === 3 || i === 4 ? "webtoon" : "novelist",
  workStatus: i < 3 ? ["집필중", "퇴고중", "구상중"][i] : null,
  isOwner: i === 1,
  isVice: false,
  lastSeenLabel: i >= 3 ? "3시간 전" : null,
}));

const CHAT_MEMBERS: RoomMember[] = MEMBERS.map((m) => ({
  id: m.id,
  name: m.name,
  characterId: m.characterId,
  chatColor: null,
  workStatus: m.workStatus,
  position: m.position,
  isOwner: m.isOwner,
  isVice: m.isVice,
  recordsVisible: true,
  lastSeenAt: null,
  todayChars: m.todayChars,
}));

const MESSAGES: ChatMessage[] = [
  ["m1", "안녕하세요! 오늘도 같이 달려봐요 💪"],
  ["m2", "저는 지금 3세트째 돌리는 중이에요"],
  ["m0", "방금 한 장면 끝냈어요. 다들 어떠세요?"],
  ["m1", "커피 한 잔 하고 다시 시작합니다 ☕ 집중 시간 끝나면 스트레칭 같이 해요"],
  ["m2", "마감이 코앞인데 마음이 급하네요 ㅠㅠ"],
].map(([userId, content], i) => ({
  id: `c${i}`,
  userId,
  content,
  createdAt: new Date().toISOString(),
  targetUserId: null,
}));

type Tab = "members" | "chat" | "record";

export default function PreviewScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("members");
  const [chat, setChat] = useState(MESSAGES);
  if (!enabled) return <Redirect href="/" />;

  const rows: ParticipantData[][] = [];
  for (let i = 0; i < MEMBERS.length; i += 2) rows.push(MEMBERS.slice(i, i + 2));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.back}>‹</Text>
        <Text style={styles.title}>마감 임박! 새벽 집필방</Text>
        <Text style={styles.menu}>⋯</Text>
      </View>
      <View style={styles.tabs}>
        {(["members", "chat", "record"] as Tab[]).map((k) => (
          <Pressable key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>
              {k === "members" ? "참여자" : k === "chat" ? "채팅" : "기록"}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === "members" && (
        <ScrollView contentContainerStyle={styles.body}>
          <PomodoroCard room={{ id: "preview", name: "미리보기" }} />
          <Text style={styles.sectionLabel}>참여자 6명 · 접속 중 3명</Text>
          {rows.map((row) => (
            <View key={row[0].id} style={styles.gridRow}>
              {row.map((p) => (
                <ParticipantCard key={p.id} data={p} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
      {tab === "chat" && (
        <ChatView
          messages={chat}
          members={CHAT_MEMBERS}
          selfId="m0"
          canModerate={false}
          onSend={async (text) => {
            setChat((prev) => [
              ...prev,
              { id: `n${prev.length}`, userId: "m0", content: text, createdAt: "", targetUserId: null },
            ]);
            return true;
          }}
          onRemove={() => {}}
          onTyping={() => {}}
        />
      )}
      {tab === "record" && (
        <ScrollView contentContainerStyle={styles.body}>
          <CharInputCard roomId="preview" position="novelist" todayChars={1930} onAdded={() => {}} onActivity={() => {}} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  back: { fontSize: 30, color: COLORS.text, lineHeight: 30, marginTop: -4 },
  title: { flex: 1, fontSize: 17, fontWeight: "600", color: COLORS.text },
  menu: { fontSize: 24, color: COLORS.text, lineHeight: 24 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.line },
  tab: { flex: 1, alignItems: "center", paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: COLORS.text },
  tabText: { fontSize: 14, color: COLORS.faint, fontWeight: "600" },
  tabTextActive: { color: COLORS.text },
  body: { padding: 12, gap: 12 },
  sectionLabel: { fontSize: 12, color: COLORS.sub },
  gridRow: { flexDirection: "row", gap: 10 },
});
