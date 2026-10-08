import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description:
    "포룸(PoRoom)의 이용 요금, 혼자 쓰기, 비공개 방, 카메라, 로그인과 개인정보, 불편한 참여자 차단 방법 등 자주 묻는 질문에 답합니다.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "포룸(PoRoom)은 무료로 사용할 수 있나요?",
    a: "네, 모든 기능을 무료로 사용할 수 있어요. 다만 유료 결제를 하시면 더 편안하고 풍부하게 포룸을 즐기실 수 있어요.",
  },
  {
    q: "혼자서도 사용할 수 있나요?",
    a: "네, 방 만들기에서 비밀방으로 설정해 방을 만들면 혼자서도 이용할 수 있어요.",
  },
  {
    q: "지인들만 방에 들어왔으면 좋겠어요.",
    a: "방 만들기에서 초대 전용으로 설정하면 초대 코드를 아는 지인들만 입장할 수 있어요.",
  },
  {
    q: "화상 카메라를 지원하나요?",
    a: "아니요. 포룸은 얼굴이나 작업 화면을 보여 줘야 한다는 부담을 느끼는 작가도 편하게 이용할 수 있도록 화상 카메라 기능을 일부러 제외했어요. 닉네임과 캐릭터만으로 참여합니다.",
  },
  {
    q: "사진 공유가 되나요?",
    a: "아직 사진 공유 기능은 구현하지 못했어요.",
  },
  {
    q: "구글 계정으로 로그인하면 어떤 정보를 수집하나요?",
    a: "로그인 확인을 위해 이메일과 이름 등 최소한의 정보만 사용하고, 구글 드라이브나 연락처 같은 구글 계정의 다른 정보는 가져오지 않아요. 자세한 내용은 개인정보처리방침에서 확인하실 수 있어요.",
  },
  {
    q: "불편한 참여자가 있어요.",
    a: "방 오른쪽 위의 설정 버튼에서 참여자 관리로 들어가 해당 참여자의 '차단' 버튼을 누르면 즉시 방에서 내보내지고, 방장이 차단을 풀기 전까지 다시 들어올 수 없어요.",
  },
  {
    q: "글자수는 어떻게 기록하나요?",
    a: "웹소설 작가는 방에서 작품을 고른 뒤 현재 글자수를 입력하면 이전 기록과의 차이가 오늘 기록에 더해져요. 웹툰 작가는 오늘 작업한 컷수를 직접 입력합니다. 기록은 랭킹과 개인 통계에 반영돼요.",
  },
  {
    q: "랭킹은 어떤 기준으로 정해지나요?",
    a: "글자수(웹툰은 컷수)와 집중시간, 대결 성적, 챌린지 성공, 타자 속도 기준으로 따로 집계돼요. 웹소설 작가와 웹툰 작가는 단위가 달라 구분해서 보여 줘요.",
  },
  {
    q: "모바일에서도 사용할 수 있나요?",
    a: "네, 모바일 웹 브라우저에서도 이용할 수 있어요. 별도 앱은 아직 정식 출시 전이에요.",
  },
];

export default function FaqPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">자주 묻는 질문</h1>
        <p className="text-sm text-neutral-500">
          찾는 내용이 없다면 <Link href="/about" className="underline">서비스 소개</Link>를 보시거나{" "}
          <a href="mailto:sjses4789@gmail.com" className="underline">sjses4789@gmail.com</a>으로 문의해 주세요.
        </p>
      </header>
      <dl className="flex flex-col gap-6">
        {FAQ.map((item) => (
          <div key={item.q} className="flex flex-col gap-1.5">
            <dt className="text-[15px] font-semibold">{item.q}</dt>
            <dd className="text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
