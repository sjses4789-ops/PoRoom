"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type Lang = "en" | "ko";
type Clause = { id: string; num: string; title: string; paras?: string[]; items?: string[] };
type Doc = { eyebrow: string; title: string; lede: string; effective: string; contact: string; terms: Clause[]; policy: Clause[]; termsHeading: string; policyHeading: string; notice: string };

const EFFECTIVE = "2026-11-02";
const CONTACT = "ggozzzzzil@gmail.com";

const KO: Doc = {
  eyebrow: "이용약관 · 커뮤니티 운영정책",
  title: "PoRoom 이용약관 및 운영정책",
  lede: "PoRoom은 웹소설·웹툰 작가를 위한 온라인 뽀모도로 작업실이자 작가 커뮤니티입니다. 서비스를 이용하려면 아래 약관과 운영정책에 동의해야 합니다.",
  effective: "시행일",
  contact: "문의",
  termsHeading: "이용약관",
  policyHeading: "커뮤니티 운영정책",
  notice: "본 문서는 서비스 운영을 위한 약관이며, 법령의 개정이나 서비스 변경에 따라 바뀔 수 있습니다. 바뀌는 경우 시행 7일 전에 서비스 안에서 알립니다(회원에게 불리한 변경은 30일 전).",
  terms: [
    {
      id: "t-purpose",
      num: "제1조",
      title: "목적",
      paras: ["이 약관은 GGOZIL(이하 \"운영자\")이 제공하는 PoRoom(poroom.kr) 및 관련 앱(이하 \"서비스\")의 이용 조건, 운영자와 회원의 권리·의무, 책임 사항을 정합니다."],
    },
    {
      id: "t-signup",
      num: "제2조",
      title: "회원가입과 연령 제한",
      items: [
        "회원가입은 구글 계정으로 하며, 가입 시 닉네임·직업(웹소설/웹툰)·생년월일(만 나이 확인용)을 입력하고 이 약관과 개인정보처리방침에 동의해야 합니다.",
        "만 14세 미만은 가입할 수 없습니다. 만 14세 미만임이 확인되면 가입이 거절되며, 이미 수집된 정보는 지체 없이 삭제합니다.",
        "생년월일 전체는 저장하지 않고, 나이 확인에 필요한 출생 연도만 보관합니다.",
        "회원은 정확한 정보를 입력해야 하며, 타인의 계정을 사용하거나 한 사람이 여러 계정으로 기록·랭킹을 부풀려서는 안 됩니다.",
      ],
    },
    {
      id: "t-service",
      num: "제3조",
      title: "서비스의 내용",
      items: [
        "작업방(실시간 접속 상태·뽀모도로·채팅·귓속말·사진 첨부), 글자수·집중시간 기록, 피드·휴식 게시판, 대결·챌린지, 랭킹, 알림·쪽지, 타자 연습 등을 제공합니다.",
        "서비스는 무료로 제공하며, 운영상 필요하면 일부 기능을 유료로 전환하거나 변경·중단할 수 있습니다. 유료 전환 시 사전에 알립니다.",
        "채팅 사진은 올린 날부터 30일이 지나면 열람할 수 없게 되고 삭제됩니다. 화면 공유는 내용을 알아볼 수 없는 저해상도 모자이크로만 전달되며 서버에 저장하지 않습니다.",
      ],
    },
    {
      id: "t-duty",
      num: "제4조",
      title: "회원의 의무와 금지 행위",
      paras: ["회원은 다음 행위를 해서는 안 됩니다."],
      items: [
        "타인을 비방·모욕·괴롭히는 행위, 혐오·차별 표현, 성적으로 부적절한 글·사진(특히 미성년자와 관련된 것)",
        "타인의 개인정보(실명, 연락처, 얼굴 사진 등)를 동의 없이 올리는 행위",
        "저작권 등 타인의 권리를 침해하는 글·사진·파일을 올리는 행위(타인의 원고를 허락 없이 올리는 것 포함)",
        "광고·홍보·스팸, 불법 도박·사기·다단계 안내",
        "기록(글자수·집중시간)을 허위로 입력하거나, 자동화 도구·비정상 방법으로 기록·랭킹·챌린지·이벤트 결과를 조작하는 행위",
        "서비스의 보안·정상 동작을 방해하는 행위(비정상적 요청, 취약점 악용, 다른 회원의 접속 방해 등)",
      ],
    },
    {
      id: "t-content",
      num: "제5조",
      title: "회원이 올린 콘텐츠",
      items: [
        "회원이 올린 글·사진 등의 권리는 회원에게 있습니다. 운영자는 서비스를 제공·홍보하는 범위(예: 피드 노출)에서만 이를 이용할 수 있습니다.",
        "회원은 자신이 올린 콘텐츠가 제3자의 권리를 침해하지 않도록 책임집니다.",
        "신고되었거나 이 약관·운영정책을 위반한 콘텐츠는 운영자가 비공개·삭제할 수 있습니다. 신고된 채팅 메시지·사진은 확인을 위해 신고 시점의 내용이 관리자에게 전달됩니다.",
      ],
    },
    {
      id: "t-sanction",
      num: "제6조",
      title: "이용 제한",
      paras: ["운영자는 약관·운영정책 위반 정도에 따라 경고, 기능 제한, 일시 정지, 영구 정지(계정 이용 제한)를 할 수 있습니다. 긴급한 경우(불법 콘텐츠, 미성년자 보호 등)에는 사전 경고 없이 조치할 수 있으며, 조치 사유는 가능한 범위에서 알립니다. 이의가 있으면 문의 메일로 알릴 수 있고 운영자는 검토 후 답합니다."],
    },
    {
      id: "t-change",
      num: "제7조",
      title: "서비스의 변경과 중단",
      paras: ["운영자는 서비스 개선·점검·장애·천재지변 등의 이유로 서비스를 변경하거나 일시 중단할 수 있으며, 가능한 경우 미리 알립니다. 무료 서비스의 변경·중단에 대해 법령이 정한 경우를 제외하고 별도의 보상은 하지 않습니다."],
    },
    {
      id: "t-withdraw",
      num: "제8조",
      title: "탈퇴와 데이터 삭제",
      items: [
        "회원은 [개인] 화면에서 언제든 탈퇴할 수 있습니다. 탈퇴하면 로그인 계정과 프로필, 기록, 게시글, 채팅, 사진 등 계정과 연결된 정보가 삭제됩니다.",
        "법령에 따라 보관해야 하는 정보(예: 접속 로그)는 개인정보처리방침이 정한 기간 동안만 따로 보관합니다.",
        "내가 방장인 방은 다른 참여자가 있으면 방장 권한이 넘어가고, 혼자라면 방이 삭제됩니다.",
      ],
    },
    {
      id: "t-liability",
      num: "제9조",
      title: "책임의 제한",
      paras: ["운영자는 천재지변, 회원의 귀책, 회원 간 분쟁, 외부 서비스(구글, 호스팅 등)의 장애로 생긴 손해에 대해 고의 또는 중대한 과실이 없는 한 책임지지 않습니다. 회원이 입력한 기록의 정확성은 회원 본인이 책임지며, 운영자는 부정 기록을 발견하면 수정·삭제할 수 있습니다."],
    },
    {
      id: "t-law",
      num: "제10조",
      title: "준거법과 분쟁",
      paras: ["이 약관은 대한민국 법령에 따라 해석되며, 분쟁이 생기면 민사소송법상 관할 법원에서 해결합니다."],
    },
  ],
  policy: [
    {
      id: "p-respect",
      num: "1",
      title: "서로 존중하기",
      paras: ["PoRoom은 함께 집중하며 쓰는 곳입니다. 방에 있는 사람들이 편하게 작업할 수 있도록 서로 존중해 주세요. 방장·부방장은 자기 방에서 채팅 삭제, 강퇴를 할 수 있고, 운영자는 서비스 전체에서 조치할 수 있습니다."],
    },
    {
      id: "p-minor",
      num: "2",
      title: "미성년자 보호",
      items: [
        "만 14세 미만은 이용할 수 없습니다. 만 14세 미만으로 보이는 회원을 발견하면 신고해 주세요.",
        "미성년자를 성적으로 묘사하거나 성적 대상으로 삼는 글·사진은 발견 즉시 비공개하고 계정을 영구 정지하며, 필요한 경우 수사기관에 협조합니다.",
        "10대 태그 방에서는 개인 연락처·SNS를 요구하거나 직접 만남을 유도하는 행위를 금지합니다.",
      ],
    },
    {
      id: "p-photo",
      num: "3",
      title: "채팅 사진과 화면 공유",
      items: [
        "사진은 방 참여자만 볼 수 있습니다. 얼굴·실명·연락처·원고 원문 등 노출되면 곤란한 정보는 올리지 마세요.",
        "내가 올린 사진은 내가 지울 수 있고, 올린 날부터 30일이 지나면 자동으로 삭제됩니다.",
        "화면 공유는 작업 중임을 알리기 위한 모자이크 화면입니다. 캡처해 외부에 올리는 행위는 금지합니다.",
      ],
    },
    {
      id: "p-record",
      num: "4",
      title: "기록의 정직함",
      items: [
        "글자수·집중시간은 직접 쓴 만큼만 입력해 주세요. 정직한 기록이 랭킹·챌린지·이벤트의 신뢰를 만듭니다.",
        "하루에 비정상적으로 많은 글자수는 자동으로 막히거나 검토 대상이 될 수 있습니다. 부정 기록이 확인되면 기록 삭제, 챌린지·이벤트 결과 취소, 이용 제한을 할 수 있습니다.",
      ],
    },
    {
      id: "p-report",
      num: "5",
      title: "신고와 처리",
      items: [
        "참여자 카드 우클릭 또는 채팅 메시지의 🚩 버튼으로 신고할 수 있습니다. 신고자는 상대에게 알려지지 않습니다.",
        "접수된 신고는 가능한 한 영업일 기준 7일 안에 확인하며, 처리되면 알림(벨)으로 알려드립니다.",
        "허위 신고를 반복하면 이용 제한 대상이 될 수 있습니다. 개인적으로 불편한 사람은 차단 기능으로 내 화면에서 숨길 수 있습니다.",
      ],
    },
    {
      id: "p-ladder",
      num: "6",
      title: "제재 단계",
      items: [
        "1단계 경고 → 2단계 기능 제한(채팅·사진·방 만들기 등) → 3단계 일시 정지(1~30일) → 4단계 영구 정지",
        "위반이 가볍고 처음이면 경고부터 시작하지만, 미성년자 보호·불법 콘텐츠·반복 위반은 단계를 건너뛸 수 있습니다.",
      ],
    },
  ],
};

const EN: Doc = {
  eyebrow: "Terms of Service · Community Policy",
  title: "PoRoom Terms of Service and Community Policy",
  lede: "PoRoom is an online Pomodoro study room and community for web-novel and webtoon writers. To use the Service you must agree to the terms and policy below.",
  effective: "Effective",
  contact: "Contact",
  termsHeading: "Terms of Service",
  policyHeading: "Community Policy",
  notice: "These terms may change with the law or the Service. We announce changes inside the Service 7 days in advance (30 days for changes that disadvantage members).",
  terms: [
    { id: "t-purpose", num: "Art. 1", title: "Purpose", paras: ["These terms set the conditions for using PoRoom (poroom.kr) and related apps (the \"Service\") run by GGOZIL (the \"Operator\"), and the rights and duties of the Operator and members."] },
    {
      id: "t-signup", num: "Art. 2", title: "Sign-up and age limit",
      items: [
        "You sign up with a Google account, enter a nickname, occupation (web novelist / webtoon artist) and your date of birth (to confirm your age), and agree to these terms and the Privacy Policy.",
        "You must be at least 14 years old. If you are under 14 your sign-up is refused and any information already collected is deleted without delay.",
        "We do not store your full date of birth, only the year of birth needed to confirm your age.",
        "Provide accurate information. Do not use someone else's account or use several accounts to inflate records or rankings.",
      ],
    },
    {
      id: "t-service", num: "Art. 3", title: "The Service",
      items: [
        "The Service includes study rooms (live presence, Pomodoro, chat, whispers, photo attachments), character-count and focus-time records, boards, duels and challenges, rankings, notifications and notes, and typing practice.",
        "The Service is free. We may change, suspend, or make some features paid when needed, with prior notice.",
        "Chat photos can no longer be opened and are deleted 30 days after upload. Screen sharing is sent only as an unreadable low-resolution mosaic and is not stored.",
      ],
    },
    {
      id: "t-duty", num: "Art. 4", title: "Member duties and prohibited conduct", paras: ["You must not:"],
      items: [
        "Insult, harass or defame others; use hateful or discriminatory language; post sexually inappropriate text or images (especially involving minors).",
        "Post others' personal information (real names, contact details, face photos) without consent.",
        "Post content that infringes others' rights, including other people's manuscripts without permission.",
        "Post advertising, spam, illegal gambling, fraud or pyramid schemes.",
        "Enter false records, or use automation or abnormal methods to manipulate records, rankings, challenges or event results.",
        "Interfere with the security or normal operation of the Service.",
      ],
    },
    {
      id: "t-content", num: "Art. 5", title: "Content you post",
      items: [
        "You keep the rights to what you post. The Operator may use it only to provide and promote the Service (for example showing it in the feed).",
        "You are responsible for making sure your content does not infringe third-party rights.",
        "The Operator may hide or delete reported content or content that breaks these terms. When you report a chat message or photo, its content at that moment is passed to the administrators for review.",
      ],
    },
    { id: "t-sanction", num: "Art. 6", title: "Restrictions", paras: ["Depending on the violation, the Operator may warn, restrict features, suspend, or permanently ban an account. In urgent cases (illegal content, protection of minors) action may be taken without prior warning; we state the reason where possible. You can object by e-mail and we will review and reply."] },
    { id: "t-change", num: "Art. 7", title: "Changes and suspension", paras: ["The Operator may change or temporarily suspend the Service for improvement, maintenance, failures or force majeure, with prior notice where possible. No compensation is paid for changes to a free Service except where the law requires."] },
    {
      id: "t-withdraw", num: "Art. 8", title: "Withdrawal and data deletion",
      items: [
        "You can withdraw at any time from the [Me] page. Your login account, profile, records, posts, chats and photos linked to the account are deleted.",
        "Information that the law requires us to keep (for example access logs) is kept separately only for the period stated in the Privacy Policy.",
        "If you own a room with other participants, ownership passes to another participant; if you are alone, the room is deleted.",
      ],
    },
    { id: "t-liability", num: "Art. 9", title: "Limitation of liability", paras: ["The Operator is not liable for damage caused by force majeure, members' own fault, disputes between members, or failures of external services (Google, hosting), unless caused by intent or gross negligence. Members are responsible for the accuracy of the records they enter; the Operator may correct or delete fraudulent records."] },
    { id: "t-law", num: "Art. 10", title: "Governing law", paras: ["These terms are governed by the laws of the Republic of Korea; disputes are resolved by the competent court under the Civil Procedure Act."] },
  ],
  policy: [
    { id: "p-respect", num: "1", title: "Be respectful", paras: ["PoRoom is a place to write together. Please treat everyone in the room with respect. Room owners and vice-owners can delete chat messages and remove members in their room; the Operator can act across the whole Service."] },
    {
      id: "p-minor", num: "2", title: "Protecting minors",
      items: [
        "Users under 14 cannot use the Service. Please report anyone who appears to be under 14.",
        "Text or images that sexualise minors are hidden immediately, the account is permanently banned, and we cooperate with investigators where needed.",
        "In rooms tagged for teens, asking for personal contact details or social media, or pushing for in-person meetings, is prohibited.",
      ],
    },
    {
      id: "p-photo", num: "3", title: "Chat photos and screen sharing",
      items: [
        "Photos are visible to room participants only. Do not post faces, real names, contact details or manuscript text you would not want exposed.",
        "You can delete your photos yourself, and they are deleted automatically 30 days after upload.",
        "Screen sharing is a mosaic that shows you are working. Capturing it and posting it elsewhere is prohibited.",
      ],
    },
    {
      id: "p-record", num: "4", title: "Honest records",
      items: [
        "Enter only what you actually wrote. Honest records are what make rankings, challenges and events trustworthy.",
        "Abnormally large daily counts may be blocked automatically or reviewed. Confirmed fraud can lead to deleted records, cancelled challenge or event results, and restrictions.",
      ],
    },
    {
      id: "p-report", num: "5", title: "Reports",
      items: [
        "Report a participant (right-click a card) or a chat message (the 🚩 button). The person reported is not told who reported them.",
        "We aim to review reports within 7 business days and notify you in the bell when handled.",
        "Repeated false reports can lead to restrictions. For personal discomfort, use Block to hide someone on your screen.",
      ],
    },
    {
      id: "p-ladder", num: "6", title: "Enforcement steps",
      items: [
        "Step 1 warning → Step 2 feature restriction (chat, photos, creating rooms) → Step 3 temporary suspension (1–30 days) → Step 4 permanent ban.",
        "A first minor violation starts with a warning, but protection of minors, illegal content and repeated violations may skip steps.",
      ],
    },
  ],
};

function Section({ clause }: { clause: Clause }) {
  return (
    <section id={clause.id} className="scroll-mt-20 border-t border-neutral-100 py-5 first:border-t-0 dark:border-neutral-800">
      <h3 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">
        <span className="mr-2 text-neutral-400">{clause.num}</span>
        {clause.title}
      </h3>
      {clause.paras?.map((p, i) => (
        <p key={i} className="mb-2 text-sm leading-relaxed text-neutral-700 last:mb-0 dark:text-neutral-300">
          {p}
        </p>
      ))}
      {clause.items && (
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {clause.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Group({ title, clauses }: { title: string; clauses: Clause[] }): ReactNode {
  return (
    <div className="mb-10">
      <h2 className="mb-1 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">{title}</h2>
      <div>{clauses.map((c) => <Section key={c.id} clause={c} />)}</div>
    </div>
  );
}

export function TermsContent() {
  const [lang, setLang] = useState<Lang>("ko");
  const doc = lang === "en" ? EN : KO;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />
            PoRoom
          </Link>
          <div className="flex items-center gap-1 text-xs">
            {(["ko", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`rounded-md px-2 py-1 ${lang === l ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
              >
                {l === "ko" ? "한국어" : "English"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-red-500">{doc.eyebrow}</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{doc.title}</h1>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{doc.lede}</p>
        <div className="mb-8 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {doc.effective} <span className="font-medium text-neutral-700 dark:text-neutral-200">{EFFECTIVE}</span>
          </span>
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {doc.contact}{" "}
            <a href={`mailto:${CONTACT}`} className="font-medium text-neutral-700 dark:text-neutral-200">
              {CONTACT}
            </a>
          </span>
          <a href="#policy" className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
            {doc.policyHeading} ↓
          </a>
        </div>

        <Group title={doc.termsHeading} clauses={doc.terms} />
        <div id="policy" className="scroll-mt-20" />
        <Group title={doc.policyHeading} clauses={doc.policy} />

        <p className="rounded-sm border border-neutral-200 border-l-2 border-l-red-400 p-4 text-xs leading-relaxed text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {doc.notice}{" "}
          <Link href="/privacy" className="underline">
            {lang === "en" ? "Privacy Policy" : "개인정보처리방침"}
          </Link>
        </p>
      </div>
    </div>
  );
}
