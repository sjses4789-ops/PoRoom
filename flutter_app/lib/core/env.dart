// 빌드할 때 --dart-define-from-file=env.json 으로 넘기는 값(tool/gen_env.mjs가 웹 .env.local의 공개 값만 뽑아 만든다).
class Env {
  const Env._();

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  // 웹 주소 — 서버 액션 호출(/api/app/*)과 캐릭터 이미지, "웹에서 열기" 링크에 쓴다.
  // 개발 중에는 WEB_URL=http://10.0.2.2:3000 처럼 로컬 웹 서버를 가리킬 수 있다.
  static const webUrl = String.fromEnvironment('WEB_URL', defaultValue: 'https://poroom.kr');

  // PREVIEW=true 로 빌드하면 로그인 없이 예시 데이터로 화면 모양만 볼 수 있다(개발용).
  static const preview = bool.fromEnvironment('PREVIEW');

  static bool get hasBackend => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}
