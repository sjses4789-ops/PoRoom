import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ChatMessage } from "../../lib/use-room-chat";
import type { RoomMember } from "../../lib/use-room-data";
import { Avatar, COLORS } from "./ui";

// 웹 채팅 패널과 같은 동작 — 내 말은 오른쪽, 다른 사람 말은 왼쪽 말풍선. 내 메시지는(방장/부방장은
// 모든 메시지를) 길게 눌러 삭제할 수 있다.
export function ChatView({
  messages,
  members,
  selfId,
  canModerate,
  onSend,
  onRemove,
  onTyping,
}: {
  messages: ChatMessage[];
  members: RoomMember[];
  selfId: string;
  canModerate: boolean;
  onSend: (text: string) => Promise<boolean>;
  onRemove: (id: string) => void;
  onTyping: () => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const memberById = new Map(members.map((m) => [m.id, m]));

  useEffect(() => {
    const id = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [messages.length]);

  const submit = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await onSend(text);
    setSending(false);
    if (ok) setInput("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>아직 대화가 없어요. 첫 인사를 남겨 보세요 👋</Text>}
        renderItem={({ item }) => {
          const mine = item.userId === selfId;
          const sender = memberById.get(item.userId);
          const canDelete = mine || canModerate;
          return (
            <Pressable
              onLongPress={() => {
                if (!canDelete) return;
                Alert.alert("메시지 삭제", "이 메시지를 삭제할까요?", [
                  { text: "취소", style: "cancel" },
                  { text: "삭제", style: "destructive", onPress: () => onRemove(item.id) },
                ]);
              }}
              style={[styles.row, mine && styles.rowMine]}
            >
              <Avatar characterId={sender?.characterId ?? null} size={30} />
              <View style={[styles.col, mine && styles.colMine]}>
                <Text style={styles.sender}>
                  {mine ? "나" : (sender?.name ?? "알 수 없음")}
                  {item.targetUserId ? "  🤫 귓속말" : ""}
                </Text>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={styles.bubbleText}>{item.content}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={(t) => {
            setInput(t);
            onTyping();
          }}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={COLORS.faint}
          onSubmitEditing={submit}
          returnKeyType="send"
          editable={!sending}
          maxLength={1000}
        />
        <Pressable style={[styles.sendBtn, (!input.trim() || sending) && styles.sendDisabled]} onPress={submit}>
          <Text style={styles.sendText}>전송</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  list: { padding: 12, gap: 12, flexGrow: 1 },
  empty: { textAlign: "center", color: COLORS.faint, marginTop: 40, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  rowMine: { flexDirection: "row-reverse" },
  col: { flexShrink: 1, gap: 2, alignItems: "flex-start" },
  colMine: { alignItems: "flex-end" },
  sender: { fontSize: 11, color: COLORS.faint },
  bubble: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, maxWidth: "100%" },
  bubbleMine: { backgroundColor: "#f1dcdc" },
  bubbleOther: { backgroundColor: COLORS.soft },
  bubbleText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  sendBtn: { backgroundColor: COLORS.text, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: "#ffffff", fontWeight: "600" },
});
