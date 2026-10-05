import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";

const BRAND = "#c17b7b";

export default function LoginScreen() {
  const { status, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "in") return <Redirect href="/" />;
  if (status === "loading") return null;

  const onPress = async () => {
    setBusy(true);
    setError(null);
    const message = await signInWithGoogle();
    setError(message);
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/icon.png")} style={styles.logo} />
      <Text style={styles.title}>PoRoom</Text>
      <Text style={styles.subtitle}>화상회의 없이 함께 집중하는{"\n"}온라인 뽀모도로 작업실</Text>

      <Pressable style={[styles.button, busy && styles.buttonBusy]} onPress={onPress} disabled={busy}>
        {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Google로 시작하기</Text>}
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.note}>웹(poroom.kr)과 같은 계정으로 이어서 사용할 수 있어요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  logo: { width: 120, height: 120, borderRadius: 24 },
  title: { fontSize: 28, fontWeight: "700", color: "#171717", marginTop: 8 },
  subtitle: { fontSize: 15, color: "#737373", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  button: { backgroundColor: BRAND, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 28, minWidth: 240, alignItems: "center" },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, textAlign: "center" },
  note: { fontSize: 12, color: "#a3a3a3", marginTop: 8, textAlign: "center" },
});
