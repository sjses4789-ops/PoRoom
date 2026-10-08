import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "서비스 소개",
  description:
    "포룸(PoRoom)은 웹소설·웹툰 작가를 위한 온라인 뽀모도로 작업실입니다. 카메라 없이 같은 방에서 집중하고, 글자수 기록과 랭킹·대결·챌린지로 꾸준히 쓰는 습관을 만들 수 있어요.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const FEATURES: { title: string; body: string }[] = [
  {
    title: "온라인 집필 작업실",
    body: "방에 들어가면 같은 시간에 작업하는 다른 작가들의 카드와 뽀모도로 진행 상태가 실시간으로 보입니다. 화상 통화 없이도 '옆에서 함께 일한다'는 감각을 얻을 수 있어요.",
  },
  {
    title: "동기화되는 뽀모도로 타이머",
    body: "집중과 휴식 시간을 직접 정해 타이머를 돌리면 같은 방 사람들에게 내 상태가 보입니다. 집중 시간은 방에 자동으로 기록됩니다.",
  },
  {
    title: "작품별 글자수·컷수 기록",
    body: "웹소설 작가는 작품을 골라 글자수를, 웹툰 작가는 작업한 컷수를 기록합니다. 날짜별로 쌓인 기록은 그래프로 확인할 수 있어요.",
  },
  {
    title: "채팅과 귓속말",
    body: "방 안에서 편하게 대화하고, 필요하면 특정 참여자에게만 귓속말을 보낼 수 있습니다. 방장과 부방장은 방을 관리할 수 있어요.",
  },
  {
    title: "랭킹, 대결, 챌린지",
    body: "글자수·집중시간 랭킹을 보고, 다른 작가와 기간을 정해 글자수를 겨루는 대결이나 매일 5천자·1만자, 매달 초단 완고 같은 반복 챌린지에 참여할 수 있습니다.",
  },
  {
    title: "캘린더, 투표, 게시판",
    body: "방마다 마감 일정을 공유하는 캘린더, 의견을 모으는 투표, 공지·정보 공유 게시판이 있습니다. 서비스 전체에는 자유·정보·인원 모집 게시판도 있어요.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">서비스 소개</h1>
        <p className="text-[15px] leading-[1.85] text-neutral-700 dark:text-neutral-300">
          포룸(PoRoom)은 웹소설 작가와 웹툰 작가를 위한 온라인 뽀모도로 작업실입니다. 연재는 몇 달, 몇 년씩 이어지는 장거리
          달리기이고, 대부분의 작가는 혼자 일하기 때문에 시작하기도 꾸준히 이어가기도 쉽지 않습니다. 포룸은 같은 방에서
          함께 시간을 보내는 구조로 그 어려움을 덜어 보려는 서비스입니다.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">왜 만들었나요</h2>
        <p className="text-[15px] leading-[1.85] text-neutral-700 dark:text-neutral-300">
          도서관이나 스터디 카페에서는 이상하게 집중이 잘 된다는 경험을 하신 적이 있을 겁니다. 옆에 누군가 있다는 것만으로
          시작이 쉬워지는 이 현상을 &lsquo;바디 더블링&rsquo;이라고 부르기도 합니다. 하지만 집에서 혼자 일하는 작가가 이런 환경을
          매번 만들기는 어렵고, 화상 모임은 얼굴이나 작업 화면을 보여 줘야 한다는 부담이 있습니다.
        </p>
        <p className="text-[15px] leading-[1.85] text-neutral-700 dark:text-neutral-300">
          그래서 포룸은 카메라와 마이크 없이 아이디(닉네임)만으로 참여하도록 만들었습니다. 같은 방에 있는 사람들의 집중·휴식
          상태가 보이는 것만으로 &lsquo;혼자가 아니다&rsquo;라는 감각을 주는 것이 목표입니다.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">이런 분들께 맞아요</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300">
          <li>웹소설을 연재하거나 집필 중인 작가</li>
          <li>웹툰을 연재하거나 작업 중인 작가</li>
          <li>다음 화 마감이 매번 촉박한 분</li>
          <li>혼자 쓰면 집중이 잘 안 되고 자꾸 미루게 되는 분</li>
          <li>혼자는 외롭지만 모임에 나가기는 부담스러운 분</li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">주요 기능</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
              <h3 className="text-[15px] font-medium">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">이용 방법</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-[1.8] text-neutral-700 dark:text-neutral-300">
          <li>구글 계정으로 로그인하고 닉네임과 직업(웹소설 작가 또는 웹툰 작가)을 정합니다.</li>
          <li>[포룸]에서 마음에 드는 방에 입장하거나 새 방을 만듭니다. 혼자 쓰고 싶다면 비공개 방도 만들 수 있어요.</li>
          <li>타이머를 시작해 집중하고, 끝나면 오늘의 글자수(웹툰은 컷수)를 기록합니다.</li>
          <li>[피드]에 오늘의 작업을 남기거나 [도전]에서 대결과 챌린지에 참여해 보세요.</li>
        </ol>
        <p className="text-sm text-neutral-500">
          더 자세한 사용법은 <Link href="/faq" className="underline">자주 묻는 질문</Link>과{" "}
          <Link href="/guide" className="underline">작가 가이드</Link>에서 볼 수 있습니다.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">운영과 문의</h2>
        <p className="text-[15px] leading-[1.85] text-neutral-700 dark:text-neutral-300">
          포룸은 GGOZIL이 운영하며, 현재 개발과 개선이 계속되는 베타 서비스입니다. 일부 기능이 바뀌거나 예고 없이 점검이
          있을 수 있습니다. 문의와 제안은 <a href="mailto:sjses4789@gmail.com" className="underline">sjses4789@gmail.com</a>
          으로 보내 주세요. 개인정보 처리에 관한 내용은{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에서 확인할 수 있습니다.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/main"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          포룸 입장하기
        </Link>
        <Link
          href="/guide"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-900"
        >
          작가 가이드 보기
        </Link>
      </div>
    </div>
  );
}
