import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppWebView } from "../components/AppWebView";

// 아직 앱 화면이 없는 부분을 웹 화면으로 보여주는 화면(방의 일정·투표·게시판·기록 등).
export default function WebScreen() {
  const { path, title } = useLocalSearchParams<{ path: string; title?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="뒤로">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? "PoRoom"}
        </Text>
      </View>
      <AppWebView path={path ?? "/main"} interceptRooms={false} padTop={false} />
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
    borderBottomColor: "#e5e5e5",
  },
  back: { fontSize: 30, color: "#171717", lineHeight: 30, marginTop: -4 },
  title: { flex: 1, fontSize: 17, fontWeight: "600", color: "#171717" },
});
