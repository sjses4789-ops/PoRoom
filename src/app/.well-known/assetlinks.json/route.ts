// 안드로이드 앱(구글 플레이 TWA)이 "이 도메인은 내 앱과 같은 주인이다"를
// 증명하는 Digital Asset Links 파일 — 이게 올바르게 서빙돼야 앱 상단의
// 주소창이 사라지고 전체화면 앱처럼 열린다.
//
// 값은 환경변수로 받는다(코드에 서명 지문을 박지 않고, 키를 바꿔도 재배포만
// 하면 되도록):
//   ANDROID_PACKAGE_NAME            예: kr.poroom.app (기본값)
//   ANDROID_SHA256_CERT_FINGERPRINTS 쉼표로 구분한 SHA-256 지문들
//     — 구글 플레이 콘솔 "앱 무결성 > 앱 서명"의 '앱 서명 키 인증서' 지문
//       (업로드 키 지문도 같이 넣어두면 내부 테스트 빌드도 통과한다)
export const dynamic = "force-dynamic";

export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME || "kr.poroom.app";
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const body =
    fingerprints.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: packageName,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ];

  return Response.json(body, { headers: { "Cache-Control": "public, max-age=300" } });
}
