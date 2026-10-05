import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "expo-router";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";
import { useAuth } from "../lib/auth";
import { APP_USER_AGENT_TOKEN, WEB_URL } from "../lib/config";
import { syncPomodoroNotifications, type PomodoroMessage } from "../lib/pomodoro-notifications";

const BRAND = "#c17b7b";

type Props = {
  /** 이 탭이 보여줄 웹 경로(예: /main) */
  path: string;
  /** 로그인 직후 첫 화면이면 웹 세션 전달 주소로 시작한다. */
  consumeHandoff?: boolean;
};

// 앱의 각 탭은 poroom.kr의 해당 페이지를 보여주는 WebView다. 웹과 같은 서버·계정·쿠키를
// 쓰므로 웹에서 한 일이 앱에, 앱에서 한 일이 웹에 그대로 반영된다. 웹은 User-Agent의
// PoRoomApp 표식을 보고 상단 메뉴/푸터/광고를 숨겨서 앱 화면처럼 보이게 한다.
export function AppWebView({ path, consumeHandoff = false }: Props) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { takeHandoffUrl, markLoggedOut } = useAuth();
  const webRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  // 첫 렌더 때 한 번만 시작 주소를 정한다(이후 바뀌면 WebView가 다시 로드되므로).
  const [initialUrl] = useState(() => (consumeHandoff ? takeHandoffUrl() : null) ?? `${WEB_URL}${path}`);

  // 안드로이드 뒤로가기: 웹 히스토리가 있으면 먼저 웹에서 뒤로 간다.
  useEffect(() => {
    if (!focused) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBackRef.current) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [focused]);

  const onNavigationStateChange = useCallback(
    (nav: WebViewNavigation) => {
      canGoBackRef.current = nav.canGoBack;
      try {
        const url = new URL(nav.url);
        if (url.origin !== new URL(WEB_URL).origin) return;
        // 웹이 로그인/랜딩 페이지로 돌아왔다 = 로그아웃되었거나 세션이 만료됨.
        if (url.pathname === "/" || url.pathname.startsWith("/login")) markLoggedOut();
      } catch {
        // 주소를 해석하지 못하면 무시한다.
      }
    },
    [markLoggedOut]
  );

  // 웹 안에서만 이동하고, 그 밖의 주소(외부 링크, mailto 등)는 기본 브라우저로 연다.
  const onShouldStartLoadWithRequest = useCallback((req: { url: string }) => {
    const url = req.url;
    if (url.startsWith(WEB_URL) || url.startsWith("about:") || url.startsWith("blob:") || url.startsWith("data:")) {
      return true;
    }
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as PomodoroMessage;
      if (msg.type === "pomodoro") syncPomodoroNotifications(msg).catch(() => {});
    } catch {
      // 우리가 보낸 형식이 아닌 메시지는 무시한다.
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WebView
        ref={webRef}
        source={{ uri: initialUrl }}
        style={styles.web}
        applicationNameForUserAgent={APP_USER_AGENT_TOKEN}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures
        overScrollMode="never"
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onMessage={onMessage}
        onLoadStart={() => {
          setFailed(false);
          setLoading(true);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) setFailed(true);
        }}
      />
      {loading && !failed && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color={BRAND} />
        </View>
      )}
      {failed && (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>연결할 수 없어요</Text>
          <Text style={styles.errorBody}>인터넷 연결을 확인한 뒤 다시 시도해 주세요.</Text>
          <Pressable
            style={styles.retry}
            onPress={() => {
              setFailed(false);
              webRef.current?.reload();
            }}
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  web: { flex: 1, backgroundColor: "#ffffff" },
  loading: { position: "absolute", top: 80, left: 0, right: 0, alignItems: "center" },
  error: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  errorTitle: { fontSize: 17, fontWeight: "600", color: "#171717" },
  errorBody: { fontSize: 14, color: "#737373", textAlign: "center" },
  retry: { marginTop: 12, backgroundColor: BRAND, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
