import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused, useRouter } from "expo-router";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";
import { useAuth } from "../lib/auth";
import { APP_USER_AGENT_TOKEN, WEB_URL } from "../lib/config";

const BRAND = "#c17b7b";
const ROOM_PATH = /^\/room\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;
// 웹이 로그인 화면으로 돌아왔을 때 세션을 다시 빌려주는 최소 간격(무한 반복 방지).
const RELINK_MIN_INTERVAL_MS = 15_000;

// 웹 화면 안의 방 링크(/room/<id>)를 누르면 웹 페이지로 이동하지 않고 앱의 방 화면을 연다.
const INTERCEPT_ROOM_LINKS_JS = `
(function () {
  if (window.__poroomAppInstalled) return;
  window.__poroomAppInstalled = true;
  var re = /^\\/room\\/[0-9a-f-]{36}\\/?$/i;
  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var path = href;
    try { path = new URL(href, location.origin).pathname; } catch (err) {}
    if (re.test(path)) {
      e.preventDefault();
      e.stopPropagation();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'openRoom', id: path.split('/')[2] }));
    }
  }, true);
})();
true;
`;

type Props = {
  /** 이 화면이 보여줄 웹 경로(예: /main) */
  path: string;
  /** false면 방 링크도 웹 화면 그대로 연다(앱 방 화면의 "웹으로 보기"에서 사용). */
  interceptRooms?: boolean;
  /** 상태 표시줄 아래 여백을 직접 처리하는 화면(자체 헤더가 있는 화면)이면 false */
  padTop?: boolean;
};

// 아직 앱 화면으로 옮기지 않은 부분(도전·휴식·개인 등)은 poroom.kr 해당 페이지를 WebView로 보여준다.
// 로그인 세션은 앱이 갖고 있고, 웹에는 액세스 토큰만 빌려준다(AuthProvider.webSessionUrl).
// 웹은 User-Agent의 PoRoomApp 표식을 보고 상단 메뉴/푸터/광고를 숨겨서 앱 화면처럼 보이게 한다.
export function AppWebView({ path, interceptRooms = true, padTop = true }: Props) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const router = useRouter();
  const { webSessionUrl, status } = useAuth();
  const webRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const lastRelinkRef = useRef(0);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  // 첫 렌더 때 한 번만 시작 주소를 정한다(이후 바뀌면 WebView가 다시 로드되므로).
  const [initialUrl] = useState(() => webSessionUrl(path) ?? `${WEB_URL}${path}`);

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

  const openRoom = useCallback(
    (roomId: string) => {
      router.push({ pathname: "/room/[id]", params: { id: roomId } });
    },
    [router]
  );

  const onNavigationStateChange = useCallback(
    (nav: WebViewNavigation) => {
      canGoBackRef.current = nav.canGoBack;
      let url: URL;
      try {
        url = new URL(nav.url);
      } catch {
        return;
      }
      if (url.origin !== new URL(WEB_URL).origin) return;

      // 방 입장 같은 동작이 웹 방 페이지로 이동시켰다면 → 앱 방 화면으로 바꿔 연다.
      const roomMatch = interceptRooms ? ROOM_PATH.exec(url.pathname) : null;
      if (roomMatch) {
        webRef.current?.goBack();
        openRoom(roomMatch[1]);
        return;
      }

      // 웹이 로그인/랜딩 페이지로 돌아왔다 = 웹 쪽에 빌려준 토큰이 만료됨. 앱 세션이 살아 있으면
      // 다시 빌려주고, 앱 세션까지 없으면 앱의 로그인 화면으로 돌아간다(상위 레이아웃이 처리).
      if (url.pathname === "/" || url.pathname.startsWith("/login")) {
        const next = webSessionUrl(path);
        const now = Date.now();
        if (status === "in" && next && now - lastRelinkRef.current > RELINK_MIN_INTERVAL_MS) {
          lastRelinkRef.current = now;
          webRef.current?.injectJavaScript(`window.location.replace(${JSON.stringify(next)}); true;`);
        }
      }
    },
    [interceptRooms, openRoom, path, status, webSessionUrl]
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

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as { type?: string; id?: string };
        if (msg.type === "openRoom" && msg.id && interceptRooms) openRoom(msg.id);
      } catch {
        // 우리가 보낸 형식이 아닌 메시지는 무시한다.
      }
    },
    [interceptRooms, openRoom]
  );

  return (
    <View style={[styles.container, { paddingTop: padTop ? insets.top : 0 }]}>
      <WebView
        ref={webRef}
        source={{ uri: initialUrl }}
        style={styles.web}
        applicationNameForUserAgent={APP_USER_AGENT_TOKEN}
        injectedJavaScript={interceptRooms ? INTERCEPT_ROOM_LINKS_JS : undefined}
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
