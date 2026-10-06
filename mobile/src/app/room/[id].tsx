import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { rpc } from "../../lib/api";
import { usePomodoro } from "../../lib/pomodoro";
import { formatClock } from "../../lib/time";
import { useRoomData } from "../../lib/use-room-data";
import { useRoomChat } from "../../lib/use-room-chat";
import { useRoomPresence } from "../../lib/use-room-presence";
import { ParticipantCard, type ParticipantData } from "../../components/room/ParticipantCard";
import { PomodoroCard } from "../../components/room/PomodoroCard";
import { ChatView } from "../../components/room/ChatView";
import { CharInputCard } from "../../components/room/CharInputCard";
import { COLORS } from "../../components/room/ui";

type Tab = "members" | "chat" | "record";
const TABS: { key: Tab; label: string }[] = [
  { key: "members", label: "참여자" },
  { key: "chat", label: "채팅" },
  { key: "record", label: "기록" },
];

const LAST_SEEN_HEARTBEAT_MS = 30_000;
const POMODORO_BROADCAST_MS = 10_000;

function relativeLabel(iso: string | null): string | null {
  if (!iso) return null;
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

// 방 화면 — 웹의 room/[id]를 앱 화면으로 옮긴 것. 참여자 카드·뽀모도로·채팅·글자수 기록은 앱 화면이고,
// 웹과 같은 실시간 채널을 써서 웹 사용자와 앱 사용자가 한 방에서 서로 보인다. 일정·투표·게시판·
// 기록 그래프처럼 아직 앱 화면이 없는 부분은 "더보기"에서 웹 화면으로 연다.
export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  if (!userId) return <Redirect href="/login" />;
  return <RoomContent roomId={id} selfId={userId} />;
}

function RoomContent({ roomId, selfId }: { roomId: string; selfId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pomodoro = usePomodoro();
  const { room, members, loading, notFound, reload } = useRoomData(roomId, selfId);

  const selfMember = members.find((m) => m.id === selfId);
  const isMember = !!selfMember;
  const selfName = selfMember?.name ?? "나";
  const presence = useRoomPresence(roomId, selfId, selfName);

  const [tab, setTab] = useState<Tab>("members");
  const [unread, setUnread] = useState(0);
  const tabRef = useRef(tab);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  const chat = useRoomChat(roomId, selfId, () => {
    if (tabRef.current !== "chat") setUnread((n) => n + 1);
  });

  const [addedToday, setAddedToday] = useState(0);
  const [, setTick] = useState(0);

  // 접속 시각 갱신(웹의 touchLastSeen heartbeat와 동일).
  useEffect(() => {
    if (!isMember) return;
    rpc("touchLastSeen", roomId);
    const id = setInterval(() => rpc("touchLastSeen", roomId), LAST_SEEN_HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [roomId, isMember]);

  // 내 뽀모도로 상태를 다른 참여자 카드에도 보이도록 presence로 알린다(웹과 같은 payload).
  const isActiveRoom = pomodoro.activeRoom?.id === roomId;
  const displayPhase = isActiveRoom ? pomodoro.phase : "idle";
  const displayRunning = isActiveRoom && pomodoro.running;
  const displayDuration = pomodoro.phaseDurationSeconds;
  const fractionRef = useRef(0);
  useEffect(() => {
    fractionRef.current = isActiveRoom ? pomodoro.elapsedFraction : 0;
  }, [isActiveRoom, pomodoro.elapsedFraction]);
  const { setPomodoroState } = presence;
  useEffect(() => {
    setPomodoroState(displayPhase, fractionRef.current, displayRunning, displayDuration);
    const id = setInterval(
      () => setPomodoroState(displayPhase, fractionRef.current, displayRunning, displayDuration),
      POMODORO_BROADCAST_MS
    );
    return () => clearInterval(id);
  }, [displayPhase, displayRunning, displayDuration, setPomodoroState]);

  // 도넛이 매초 자연스럽게 흘러가도록 화면을 1초마다 다시 그린다.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const goMore = useCallback(() => {
    router.push({ pathname: "/web", params: { path: `/room/${roomId}`, title: room?.name ?? "방" } });
  }, [router, roomId, room?.name]);

  const confirmLeave = useCallback(() => {
    Alert.alert("방 나가기", "이 방에서 나갈까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "나가기",
        style: "destructive",
        onPress: async () => {
          if (pomodoro.activeRoom?.id === roomId) pomodoro.reset();
          await rpc("leaveRoom", roomId);
          router.back();
        },
      },
    ]);
  }, [pomodoro, roomId, router]);

  const openMenu = () => {
    Alert.alert(room?.name ?? "방", undefined, [
      { text: "일정·투표·게시판·기록 (웹)", onPress: goMore },
      { text: "방 나가기", style: "destructive", onPress: confirmLeave },
      { text: "닫기", style: "cancel" },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }

  if (notFound || !room) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.title}>방을 찾을 수 없어요</Text>
        <Pressable style={styles.primary} onPress={() => router.back()}>
          <Text style={styles.primaryText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  if (!isMember) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.title}>{room.name}</Text>
        <Text style={styles.sub}>
          {room.join_type === "open" ? "아직 이 방에 입장하지 않았어요." : "초대코드로 입장할 수 있는 방이에요."}
        </Text>
        {room.join_type === "open" && (
          <Pressable
            style={styles.primary}
            onPress={async () => {
              await rpc("joinOpenRoom", roomId);
              reload();
            }}
          >
            <Text style={styles.primaryText}>입장하기</Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>뒤로</Text>
        </Pressable>
      </View>
    );
  }

  const canModerate = !!selfMember && (selfMember.isOwner || selfMember.isVice);

  const participants: ParticipantData[] = members.map((m) => {
    const isSelf = m.id === selfId;
    const pom = isSelf
      ? { phase: displayPhase, elapsedFraction: isActiveRoom ? pomodoro.elapsedFraction : 0 }
      : presence.getPomodoroState(m.id);
    const status = isSelf ? "idle" : presence.getStatus(m.id);
    return {
      id: m.id,
      name: m.name,
      isSelf,
      characterId: m.characterId,
      phase: pom.phase,
      elapsedFraction: pom.elapsedFraction,
      presence: isSelf ? (presence.getStatus(m.id) === "typing" ? "typing" : "idle") : status,
      recordsVisible: m.recordsVisible,
      todayChars: m.todayChars + (isSelf ? addedToday : 0),
      position: m.position,
      workStatus: m.workStatus,
      isOwner: m.isOwner,
      isVice: m.isVice,
      lastSeenLabel: relativeLabel(m.lastSeenAt),
    };
  });
  // "나"는 항상 맨 앞, 나머지는 접속 중인 사람이 먼저, 그다음 이름순(웹과 동일).
  const others = participants
    .filter((p) => !p.isSelf)
    .sort(
      (a, b) =>
        Number(a.presence === "offline") - Number(b.presence === "offline") || a.name.localeCompare(b.name, "ko")
    );
  const ordered = [...participants.filter((p) => p.isSelf), ...others];
  const onlineCount = ordered.filter((p) => p.presence !== "offline").length;

  const rows: ParticipantData[][] = [];
  for (let i = 0; i < ordered.length; i += 2) rows.push(ordered.slice(i, i + 2));

  const todayChars = (selfMember?.todayChars ?? 0) + addedToday;
  const selfPosition = selfMember?.position ?? "novelist";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="뒤로">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {room.name}
        </Text>
        {isActiveRoom && pomodoro.started ? (
          <Text style={[styles.miniClock, { color: displayPhase === "break" ? COLORS.break : COLORS.focus }]}>
            {formatClock(pomodoro.remainingSeconds)}
          </Text>
        ) : null}
        <Pressable onPress={openMenu} hitSlop={12} accessibilityLabel="더보기">
          <Text style={styles.menu}>⋯</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => {
              setTab(t.key);
              if (t.key === "chat") setUnread(0);
            }}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
              {t.key === "chat" && unread > 0 ? `  ${unread > 99 ? "99+" : unread}` : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "members" && (
        <ScrollView contentContainerStyle={styles.body}>
          <PomodoroCard room={{ id: room.id, name: room.name }} />
          <Text style={styles.sectionLabel}>
            참여자 {members.length}
            {room.capacity ? `/${room.capacity}` : ""}명 · 접속 중 {onlineCount}명
          </Text>
          {rows.map((row) => (
            <View key={row[0].id} style={styles.gridRow}>
              {row.map((p) => (
                <ParticipantCard key={p.id} data={p} />
              ))}
              {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </ScrollView>
      )}

      {tab === "chat" && (
        <ChatView
          messages={chat.messages}
          members={members}
          selfId={selfId}
          canModerate={canModerate}
          onSend={chat.send}
          onRemove={chat.remove}
          onTyping={presence.reportTyping}
        />
      )}

      {tab === "record" && (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <PomodoroCard room={{ id: room.id, name: room.name }} />
          <CharInputCard
            roomId={room.id}
            position={selfPosition}
            todayChars={todayChars}
            onAdded={(delta) => setAddedToday((n) => n + delta)}
            onActivity={presence.reportTyping}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "#ffffff" },
  title: { fontSize: 17, fontWeight: "600", color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.sub, textAlign: "center" },
  primary: { backgroundColor: COLORS.brand, borderRadius: 8, paddingHorizontal: 22, paddingVertical: 11 },
  primaryText: { color: "#ffffff", fontWeight: "600" },
  link: { color: COLORS.sub, fontSize: 14, marginTop: 4 },
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "600", color: COLORS.text },
  miniClock: { fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
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
