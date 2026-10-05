import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 웹의 뽀모도로 상태(PomodoroProvider → postToNative)를 받아 "집중 끝/휴식 끝" 알림을
// 앱이 직접 예약한다. 웹페이지는 앱이 백그라운드로 가면 멈추지만, 예약된 알림은
// 운영체제가 정해진 시각에 울려준다.
export type PomodoroMessage = {
  type: "pomodoro";
  running: boolean;
  phase: "focus" | "break";
  remainingSeconds: number;
  focusMinutes: number;
  breakMinutes: number;
  roomName: string | null;
};

const CHANNEL_ID = "pomodoro";
// 한 번 시작하면 이 횟수만큼의 전환을 미리 예약한다(약 4시간치: 25+5분 × 8).
// 앱을 다시 열면 웹이 상태를 다시 보내서 예약이 새로 갱신된다.
const MAX_SCHEDULED_TRANSITIONS = 16;

export async function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "뽀모도로 알림",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function syncPomodoroNotifications(msg: PomodoroMessage) {
  // 항상 이전 예약을 지우고 현재 상태 기준으로 다시 만든다(일시정지/초기화 포함).
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!msg.running || msg.remainingSeconds <= 0) return;
  if (!(await ensurePermission())) return;

  let secondsFromNow = msg.remainingSeconds;
  let phase = msg.phase;
  const where = msg.roomName ? `${msg.roomName} · ` : "";

  for (let i = 0; i < MAX_SCHEDULED_TRANSITIONS; i++) {
    const endingFocus = phase === "focus";
    await Notifications.scheduleNotificationAsync({
      content: {
        title: endingFocus ? "집중 시간이 끝났어요" : "휴식이 끝났어요",
        body: `${where}${endingFocus ? `${msg.breakMinutes}분 동안 쉬어가요 ☕` : "다시 집중해 볼까요? ✍️"}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(secondsFromNow)),
        channelId: CHANNEL_ID,
      },
    });
    phase = endingFocus ? "break" : "focus";
    secondsFromNow += (endingFocus ? msg.breakMinutes : msg.focusMinutes) * 60;
  }
}
