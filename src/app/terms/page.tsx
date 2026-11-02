import type { Metadata } from "next";
import { TermsContent } from "./terms-content";

export const metadata: Metadata = {
  title: "이용약관·운영정책 | PoRoom",
  description: "PoRoom 이용약관과 커뮤니티 운영정책 — 가입 연령, 금지 행위, 신고·제재 절차, 탈퇴와 데이터 삭제.",
};

export default function TermsPage() {
  return <TermsContent />;
}
