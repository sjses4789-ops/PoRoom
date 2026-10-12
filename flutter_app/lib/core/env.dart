// 빌드할 때 --dart-define-from-file=env.json 으로 넘기는 값(tool/gen_env.mjs가 웹 .env.local의 공개 값만 뽑아 만든다).
class Env {
  const Env._();

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  // 웹 주소 — 서버 액션 호출(/api/app/*)과 캐릭터 이미지, "웹에서 열기" 링크에 쓴다.
  // 개발 중에는 WEB_URL=http://10.0.2.2:3000 처럼 로컬 웹 서버를 가리킬 수 있다.
  static const webUrl = String.fromEnvironment('WEB_URL', defaultValue: 'https://poroom.kr');

  // 앱 안에서 바로 구글 계정을 고르는 로그인(네이티브)에 쓰는 구글 클라이언트 ID.
  //  - GOOGLE_WEB_CLIENT_ID: Supabase 구글 로그인에 등록된 "웹 애플리케이션" 클라이언트 ID(ID 토큰의 대상이 된다).
  //  - GOOGLE_IOS_CLIENT_ID: iOS 클라이언트 ID(iOS에서만).
  // 안드로이드 클라이언트 ID는 코드에 넣지 않는다 — 구글이 패키지 이름 + SHA-1 지문으로 알아본다.
  // GOOGLE_WEB_CLIENT_ID가 없으면 브라우저를 거치는 로그인으로 대신한다.
  static const googleWebClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');
  static const googleIosClientId = String.fromEnvironment('GOOGLE_IOS_CLIENT_ID');

  // PREVIEW=true 로 빌드하면 로그인 없이 예시 데이터로 화면 모양만 볼 수 있다(개발용).
  static const preview = bool.fromEnvironment('PREVIEW');

  // PREVIEW_GUEST=true 이면 미리보기도 로그인 전(보기 전용) 상태로 시작한다(개발용).
  static const previewGuest = bool.fromEnvironment('PREVIEW_GUEST');

  static bool get hasBackend => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}
