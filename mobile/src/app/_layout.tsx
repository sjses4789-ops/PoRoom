import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth";
import { PomodoroProvider } from "../lib/pomodoro";
import { setupNotifications } from "../lib/pomodoro-notifications";

export default function RootLayout() {
  useEffect(() => {
    setupNotifications().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PomodoroProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="room/[id]" />
            <Stack.Screen name="web" />
          </Stack>
        </PomodoroProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
