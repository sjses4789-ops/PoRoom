"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type Lang = "en" | "ko";

type Clause = {
  id: string;
  num: string;
  title: string;
  body: ReactNode;
};

function P({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <p
      className={`mb-3 last:mb-0 text-sm leading-relaxed ${
        muted ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-700 dark:text-neutral-300"
      }`}
    >
      {children}
    </p>
  );
}

function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="mb-3 last:mb-0 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      {children}
    </ul>
  );
}

function Ol({ children }: { children: ReactNode }) {
  return (
    <ol className="mb-3 last:mb-0 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      {children}
    </ol>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mb-3 overflow-x-auto rounded-sm border border-neutral-200 dark:border-neutral-700">
      <table className="w-full min-w-max border-collapse text-left text-xs">
        <thead>
          <tr className="bg-neutral-50 dark:bg-neutral-800">
            {head.map((h) => (
              <th
                key={h}
                className="border-b border-neutral-200 px-3 py-2 font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2.5 align-top ${
                    j === 0
                      ? "font-medium text-neutral-800 dark:text-neutral-100"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CLAUSES_EN: Clause[] = [
  {
    id: "purpose",
    num: "1",
    title: "Purpose",
    body: (
      <P>
        This Privacy Policy explains what personal information GGOZIL (&quot;the Operator&quot;),
        the operator of PoRoom (poroom.kr), collects from members of the online Pomodoro
        study-room service &quot;PoRoom&quot; (&quot;the Service&quot;), why it is collected, how
        long it is kept, and what rights members can exercise over their own information.
      </P>
    ),
  },
  {
    id: "collection",
    num: "2",
    title: "Information We Collect",
    body: (
      <>
        <P>The Operator collects the following information to provide the Service.</P>

        <h3 className="mb-1.5 mt-4 text-sm font-semibold text-neutral-900 dark:text-white">
          1. Collected at Google sign-in
        </h3>
        <Ul>
          <li>Email address, name, profile photo URL, and your Google account identifier (sub)</li>
        </Ul>

        <h3 className="mb-1.5 mt-4 text-sm font-semibold text-neutral-900 dark:text-white">
          2. Generated while you use the Service
        </h3>
        <Table
          head={["Category", "Items"]}
          rows={[
            ["Profile", "Nickname, character/pet appearance settings, chat bubble color, status message"],
            ["Study rooms", "Rooms created or joined, participant lists, online/offline status"],
            ["Records", "Character count, focus time, and break time logs; work list and per-work character records; attendance days"],
            ["Communication", "Chat messages, whispers, board posts (Free / Info / Recruiting)"],
            ["Schedule & activity", "Calendar events, polls and responses, ranking / duel / challenge participation, typing-practice scores"],
            ["Collected automatically", "Cookies, access logs, device/browser information (OS, screen size, etc.), usage records"],
          ]}
        />
        <P muted>
          Paid membership is not yet available and is currently under development. If a payment
          feature is introduced, the Operator will revise this Policy and provide separate notice
          before collecting the minimum information required to process payments.
        </P>
      </>
    ),
  },
  {
    id: "methods",
    num: "3",
    title: "How Information Is Collected",
    body: (
      <Ul>
        <li>Through Google OAuth sign-in</li>
        <li>Entered directly by you within the Service (nickname, chat, posts, records, etc.)</li>
        <li>Automatically generated while you use the Service (access logs, cookies, etc.)</li>
      </Ul>
    ),
  },
  {
    id: "purposes",
    num: "4",
    title: "Purposes of Collection and Use",
    body: (
      <Ol>
        <li>
          <strong>Account management</strong> — identity verification and sign-in via Google
          account, fraud prevention, handling reports and restrictions
        </li>
        <li>
          <strong>Core service delivery</strong> — creating and joining study rooms, syncing the
          Pomodoro timer and participant status, chat, character-count/focus-time logging,
          rankings, duels, challenges, calendar, polls, boards, and typing practice
        </li>
        <li><strong>Service improvement</strong> — usage analytics, troubleshooting, and feature improvement</li>
        <li><strong>Advertising</strong> — serving ads through Google AdSense (see Article 10)</li>
      </Ol>
    ),
  },
  {
    id: "retention",
    num: "5",
    title: "Retention and Use Period",
    body: (
      <>
        <P>
          In principle, the Operator destroys personal information without delay once its
          collection and use purpose has been achieved. When you delete your account, your
          nickname, records, works, chat history, and other account-linked personal information
          are removed immediately, along with your membership in any rooms you had joined.
        </P>
        <P>
          Where applicable law requires longer retention, the Operator retains the relevant
          information for the period specified by that law before destroying it.
        </P>
        <Table
          head={["Item", "Legal basis", "Retention period"]}
          rows={[
            ["Service access logs", "Protection of Communications Secrets Act (Korea)", "3 months"],
            [
              "Records related to advertising, contracts, and withdrawal of consumer orders",
              "Act on Consumer Protection in Electronic Commerce (Korea)",
              "As prescribed by law (not currently applicable — payments are not yet offered)",
            ],
          ]}
        />
      </>
    ),
  },
  {
    id: "third-party",
    num: "6",
    title: "Provision to Third Parties",
    body: (
      <>
        <P>
          The Operator processes personal information only within the purposes described in
          Articles 1 and 4, and does not provide it to third parties without your consent, except
          in the following cases:
        </P>
        <Ul>
          <li>You have given prior, separate consent</li>
          <li>Disclosure is required by law, or requested by an investigative agency following the procedures prescribed by law</li>
        </Ul>
      </>
    ),
  },
  {
    id: "processors",
    num: "7",
    title: "Outsourced Processing",
    body: (
      <>
        <P>To operate the Service reliably, the Operator outsources the following processing tasks:</P>
        <Table
          head={["Processor", "Outsourced task"]}
          rows={[
            ["Supabase, Inc.", "Database, authentication (login sessions), and realtime communication (chat, presence) hosting"],
            ["Google LLC", "Google OAuth sign-in, Google AdSense advertising"],
          ]}
        />
      </>
    ),
  },
  {
    id: "transfer",
    num: "8",
    title: "Overseas Transfer of Personal Information",
    body: (
      <P>
        The processors listed in Article 7 may operate servers located outside your country, in
        which case your personal information may be transferred to, and stored or processed in,
        those locations. The Operator confirms that these processors take appropriate measures to
        protect personal information in accordance with applicable law.
      </P>
    ),
  },
  {
    id: "rights",
    num: "9",
    title: "Your Rights and How to Exercise Them",
    body: (
      <Ul>
        <li>You may request to view, correct, delete, or suspend processing of your personal information at any time.</li>
        <li>Items such as your nickname, character, and chat color can be edited directly on the [Me] page and elsewhere in the Service.</li>
        <li>You can delete your account from the account settings&apos; &quot;Delete account&quot; menu; doing so removes you from every room you have joined and deletes the related personal information.</li>
        <li>If the above is not practical, contact the address in Article 14 and the Operator will act on your request without delay.</li>
      </Ul>
    ),
  },
  {
    id: "cookies",
    num: "10",
    title: "Cookies and Advertising",
    body: (
      <>
        <P>
          The Service uses cookies to keep you signed in and to remember your language
          preference. You can refuse cookies through your browser settings, but this may limit
          some features, such as staying signed in.
        </P>
        <P>
          The Service displays ads through <strong>Google AdSense</strong>. Google and other ad
          providers may use cookies to serve ads based on your interests. You can opt out of
          personalized advertising via{" "}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-900 dark:hover:text-white"
          >
            Google Ads Settings
          </a>{" "}
          or{" "}
          <a
            href="https://www.aboutads.info/choices"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-900 dark:hover:text-white"
          >
            aboutads.info
          </a>
          .
        </P>
      </>
    ),
  },
  {
    id: "destruction",
    num: "11",
    title: "Destruction Procedure and Method",
    body: (
      <Ul>
        <li><strong>Procedure</strong> — Personal information whose retention purpose has been fulfilled is reviewed and destroyed without delay.</li>
        <li><strong>Method</strong> — Information stored in electronic file form is permanently deleted using methods that prevent recovery.</li>
      </Ul>
    ),
  },
  {
    id: "security",
    num: "12",
    title: "Measures to Secure Personal Information",
    body: (
      <Ul>
        <li>Sign-in relies solely on Google social login, so PoRoom never stores a password of yours.</li>
        <li>Database access is restricted through row-level access control (Row Level Security), limiting each user to their own data and any data explicitly marked public.</li>
        <li>Communication between you and the Service is encrypted via HTTPS.</li>
      </Ul>
    ),
  },
  {
    id: "children",
    num: "13",
    title: "Protection of Children",
    body: (
      <P>
        The Service is not directed at children under the age of 14, and registration by children
        under 14 is not permitted. If the Operator becomes aware that personal information from a
        child under 14 has been collected, it will delete that information without delay and take
        any other necessary action.
      </P>
    ),
  },
  {
    id: "contact",
    num: "14",
    title: "Privacy Officer and Contact",
    body: (
      <>
        <P>
          The Operator has designated a Privacy Officer to handle inquiries, complaints, and
          remedies related to personal information processing.
        </P>
        <div className="mb-3 grid gap-2 rounded-sm border border-neutral-200 p-4 text-sm dark:border-neutral-700">
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">Service</span>
            <span className="text-neutral-800 dark:text-neutral-100">PoRoom</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">Operator</span>
            <span className="text-neutral-800 dark:text-neutral-100">GGOZIL (independent developer)</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">Privacy officer</span>
            <span className="text-neutral-800 dark:text-neutral-100">GGOZIL</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">Email</span>
            <a href="mailto:sjses4789@gmail.com" className="text-neutral-800 underline dark:text-neutral-100">
              sjses4789@gmail.com
            </a>
          </div>
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">Website</span>
            <a href="https://poroom.kr" className="text-neutral-800 underline dark:text-neutral-100">
              https://poroom.kr
            </a>
          </div>
        </div>
        <P muted>
          For complaints or reports regarding personal information infringement, you may also
          contact the Korea Internet &amp; Security Agency&apos;s Privacy Infringement Report
          Center (privacy.kisa.or.kr, 118) or the Personal Information Dispute Mediation
          Committee (www.kopico.go.kr, 1833-6972).
        </P>
      </>
    ),
  },
  {
    id: "notice",
    num: "15",
    title: "Duty to Notify",
    body: (
      <>
        <P>
          If this Privacy Policy is added to, removed, or amended, the Operator will announce the
          change through an in-service notice or the Feedback page at least 7 days before it
          takes effect (at least 30 days for material changes).
        </P>
        <div className="rounded-sm bg-neutral-50 px-4 py-3 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          Announced August 25, 2026 · Effective August 25, 2026 · Version v1.1
        </div>
      </>
    ),
  },
];

const CLAUSES_KO: Clause[] = [
  {
    id: "purpose",
    num: "1",
    title: "목적",
    body: (
      <P>
        이 개인정보처리방침은 PoRoom(poroom.kr)을 운영하는 GGOZIL(이하 &quot;운영자&quot;)이
        온라인 뽀모도로 스터디룸 서비스 &quot;PoRoom&quot;(이하 &quot;서비스&quot;)의 회원으로부터
        어떤 개인정보를 어떤 목적으로 수집하고, 얼마 동안 보관하며, 회원이 자신의 개인정보에 대해
        어떤 권리를 행사할 수 있는지 설명합니다.
      </P>
    ),
  },
  {
    id: "collection",
    num: "2",
    title: "수집하는 개인정보의 항목",
    body: (
      <>
        <P>운영자는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.</P>

        <h3 className="mb-1.5 mt-4 text-sm font-semibold text-neutral-900 dark:text-white">
          1. 구글 소셜 로그인 시 수집되는 항목
        </h3>
        <Ul>
          <li>이메일 주소, 이름, 프로필 사진 URL, 구글 계정 고유 식별자(sub)</li>
        </Ul>

        <h3 className="mb-1.5 mt-4 text-sm font-semibold text-neutral-900 dark:text-white">
          2. 서비스 이용 과정에서 생성·수집되는 항목
        </h3>
        <Table
          head={["구분", "항목"]}
          rows={[
            ["프로필", "닉네임, 캐릭터·펫 이미지 설정, 채팅 말풍선 색상, 상태 메시지"],
            ["스터디룸", "방 생성·참여 기록, 참여자 목록, 접속 상태(온라인 여부)"],
            ["기록", "글자수·집중시간·휴식시간 기록, 작품 목록 및 작품별 글자수 기록, 출석일"],
            ["소통", "채팅 메시지, 귓속말, 게시판(자유·정보·인원 모집) 게시글"],
            ["일정·활동", "캘린더 일정, 투표 생성 및 응답, 랭킹·대결·챌린지 참여 기록, 타자 연습 기록"],
            ["자동 수집", "쿠키, 접속 로그, 기기·브라우저 정보(OS, 화면 크기 등), 서비스 이용 기록"],
          ]}
        />
        <P muted>
          결제(유료 등급) 기능은 현재 준비 중이며 실제로 이용자에게 제공되지 않습니다. 추후 결제
          기능이 도입되면 결제 처리에 필요한 최소한의 정보를 수집하기 전, 이 방침을 개정하여
          별도로 고지합니다.
        </P>
      </>
    ),
  },
  {
    id: "methods",
    num: "3",
    title: "개인정보의 수집 방법",
    body: (
      <Ul>
        <li>구글(Google) OAuth 소셜 로그인을 통한 수집</li>
        <li>이용자가 서비스 화면에서 직접 입력(닉네임, 채팅, 게시글, 기록 등)</li>
        <li>서비스 이용 과정에서 자동으로 생성·수집(접속 기록, 쿠키 등)</li>
      </Ul>
    ),
  },
  {
    id: "purposes",
    num: "4",
    title: "개인정보의 수집 및 이용 목적",
    body: (
      <Ol>
        <li><strong>회원 관리</strong> — 구글 계정 기반 본인 확인 및 로그인, 부정 이용 방지, 신고·제재 처리</li>
        <li><strong>핵심 서비스 제공</strong> — 스터디룸 생성·참여, 뽀모도로 타이머 및 참여자 상태 동기화, 채팅, 글자수·집중시간 기록, 랭킹·대결·챌린지, 캘린더, 투표, 게시판, 타자 연습</li>
        <li><strong>서비스 개선</strong> — 이용 통계 분석, 오류 확인 및 기능 개선</li>
        <li><strong>광고 게재</strong> — Google AdSense를 통한 광고 게재(제10조 참조)</li>
      </Ol>
    ),
  },
  {
    id: "retention",
    num: "5",
    title: "개인정보의 보유 및 이용 기간",
    body: (
      <>
        <P>
          운영자는 원칙적으로 개인정보 수집·이용 목적이 달성되면 지체 없이 해당 정보를
          파기합니다. 이용자가 회원 탈퇴를 요청하면, 참여 중인 방에서의 탈퇴 처리와 함께
          닉네임·기록·작품·채팅 등 계정과 연결된 개인정보가 즉시 삭제됩니다.
        </P>
        <P>
          다만 관계 법령에 특별한 보존 의무가 있는 경우, 해당 법령이 정한 기간 동안 별도 보관 후
          파기합니다.
        </P>
        <Table
          head={["보존 항목", "보존 근거", "보존 기간"]}
          rows={[
            ["서비스 이용 관련 접속 기록", "통신비밀보호법", "3개월"],
            ["표시·광고, 계약·청약철회 등 소비자 관련 기록", "전자상거래법", "해당 법령이 정한 기간(현재 결제 미도입으로 해당 없음)"],
          ]}
        />
      </>
    ),
  },
  {
    id: "third-party",
    num: "6",
    title: "개인정보의 제3자 제공",
    body: (
      <>
        <P>
          운영자는 이용자의 개인정보를 제1조 및 제4조에 명시한 목적 범위 내에서만 처리하며,
          원칙적으로 이용자의 동의 없이 제3자에게 제공하지 않습니다. 다만 다음의 경우는 예외로
          합니다.
        </P>
        <Ul>
          <li>이용자가 사전에 별도로 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
        </Ul>
      </>
    ),
  },
  {
    id: "processors",
    num: "7",
    title: "개인정보 처리의 위탁",
    body: (
      <>
        <P>운영자는 안정적인 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.</P>
        <Table
          head={["수탁업체", "위탁 업무 내용"]}
          rows={[
            ["Supabase, Inc.", "데이터베이스, 인증(로그인 세션), 실시간 통신(채팅·참여자 상태) 인프라 호스팅"],
            ["Google LLC", "구글 소셜 로그인(OAuth) 인증, Google AdSense 광고 게재"],
          ]}
        />
      </>
    ),
  },
  {
    id: "transfer",
    num: "8",
    title: "개인정보의 국외 이전",
    body: (
      <P>
        제7조의 수탁업체는 해외에 서버를 두고 있을 수 있으며, 이 경우 이용자의 개인정보가
        국외로 이전되어 저장·처리될 수 있습니다. 운영자는 관계 법령에 따라 수탁업체가 개인정보를
        안전하게 관리하도록 필요한 조치를 확인하고 있습니다.
      </P>
    ),
  },
  {
    id: "rights",
    num: "9",
    title: "이용자 및 법정대리인의 권리와 행사 방법",
    body: (
      <Ul>
        <li>이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요청할 수 있습니다.</li>
        <li>닉네임, 캐릭터, 채팅 색상 등 일부 정보는 [개인] 페이지 및 서비스 화면에서 이용자가 직접 수정할 수 있습니다.</li>
        <li>회원 탈퇴는 계정 설정의 &quot;탈퇴하기&quot; 메뉴에서 직접 진행할 수 있으며, 탈퇴 시 참여 중인 모든 방에서 나가지고 관련 개인정보가 삭제됩니다.</li>
        <li>위 방법이 어려운 경우, 제14조의 연락처로 요청하면 지체 없이 조치합니다.</li>
      </Ul>
    ),
  },
  {
    id: "cookies",
    num: "10",
    title: "쿠키 및 광고 서비스",
    body: (
      <>
        <P>
          서비스는 로그인 상태 유지, 언어(다국어) 설정 저장 등을 위해 쿠키를 사용합니다. 이용자는
          브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 유지 등 일부 기능
          이용에 제한이 있을 수 있습니다.
        </P>
        <P>
          서비스는 <strong>Google AdSense</strong>를 통해 광고를 게재합니다. Google 등 광고
          제공업체는 이용자의 관심사에 기반한 광고를 제공하기 위해 쿠키를 사용할 수 있습니다.
          이용자는{" "}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-900 dark:hover:text-white"
          >
            Google 광고 설정
          </a>{" "}
          또는{" "}
          <a
            href="https://www.aboutads.info/choices"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-900 dark:hover:text-white"
          >
            aboutads.info
          </a>
          에서 맞춤 광고 수신을 거부할 수 있습니다.
        </P>
      </>
    ),
  },
  {
    id: "destruction",
    num: "11",
    title: "개인정보의 파기 절차 및 방법",
    body: (
      <Ul>
        <li><strong>파기 절차</strong> — 보유 목적이 달성된 개인정보는 별도의 검토 후 지체 없이 파기합니다.</li>
        <li><strong>파기 방법</strong> — 전자적 파일 형태로 저장된 정보는 복구할 수 없는 방법으로 영구 삭제합니다.</li>
      </Ul>
    ),
  },
  {
    id: "security",
    num: "12",
    title: "개인정보의 안전성 확보 조치",
    body: (
      <Ul>
        <li>비밀번호를 별도로 저장하지 않는 구글 소셜 로그인만을 인증 수단으로 사용합니다.</li>
        <li>데이터베이스 접근을 행 단위로 제어하는 접근 통제(Row Level Security)를 적용해, 이용자가 자신 또는 공개 범위 내의 데이터에만 접근하도록 제한합니다.</li>
        <li>이용자와 서비스 간 통신은 HTTPS로 암호화됩니다.</li>
      </Ul>
    ),
  },
  {
    id: "children",
    num: "13",
    title: "아동의 개인정보 보호",
    body: (
      <P>
        본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만 아동의 회원가입을
        제한합니다. 만 14세 미만 아동의 개인정보가 수집된 사실을 인지한 경우, 운영자는 지체 없이
        해당 정보를 삭제하는 등 필요한 조치를 취합니다.
      </P>
    ),
  },
  {
    id: "contact",
    num: "14",
    title: "개인정보 보호책임자 및 문의처",
    body: (
      <>
        <P>
          운영자는 개인정보 처리에 관한 이용자의 문의·불만 처리 및 피해 구제를 위해 아래와 같이
          개인정보 보호책임자를 지정하고 있습니다.
        </P>
        <div className="mb-3 grid gap-2 rounded-sm border border-neutral-200 p-4 text-sm dark:border-neutral-700">
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">서비스명</span>
            <span className="text-neutral-800 dark:text-neutral-100">PoRoom (포룸)</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">운영자</span>
            <span className="text-neutral-800 dark:text-neutral-100">GGOZIL (개인 프로젝트)</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">보호책임자</span>
            <span className="text-neutral-800 dark:text-neutral-100">GGOZIL</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">이메일</span>
            <a href="mailto:sjses4789@gmail.com" className="text-neutral-800 underline dark:text-neutral-100">
              sjses4789@gmail.com
            </a>
          </div>
          <div className="flex gap-3">
            <span className="w-28 shrink-0 text-neutral-400 dark:text-neutral-500">서비스 주소</span>
            <a href="https://poroom.kr" className="text-neutral-800 underline dark:text-neutral-100">
              https://poroom.kr
            </a>
          </div>
        </div>
        <P muted>
          기타 개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보침해신고센터(privacy.kisa.or.kr
          / 국번없이 118), 개인정보 분쟁조정위원회(www.kopico.go.kr / 1833-6972) 등 관계 기관에
          문의할 수 있습니다.
        </P>
      </>
    ),
  },
  {
    id: "notice",
    num: "15",
    title: "고지의 의무",
    body: (
      <>
        <P>
          이 개인정보처리방침의 내용이 추가·삭제·수정되는 경우, 시행 최소 7일 전(중요한 내용의
          변경은 최소 30일 전)에 서비스 내 공지사항 또는 피드백 페이지를 통해 고지합니다.
        </P>
        <div className="rounded-sm bg-neutral-50 px-4 py-3 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          공고일자 2026. 8. 25. · 시행일자 2026. 8. 25. · 버전 v1.1
        </div>
      </>
    ),
  },
];

const STRINGS = {
  en: {
    eyebrow: "Privacy Policy",
    title: "PoRoom Privacy Policy",
    lede:
      "GGOZIL, operator of PoRoom, respects your privacy and complies with applicable data protection law. This page explains what information PoRoom collects, why, and what rights you have.",
    effective: "Effective",
    contact: "Contact",
    tocLabel: "Contents",
    summaryTitle: "At a glance",
    summary: [
      <>
        Sign-in is <strong>Google-only</strong> — PoRoom never stores your password.
      </>,
      <>
        Nicknames, chats, records, and posts you create are stored only to run the Service and
        are never disclosed at will.
      </>,
      <>
        Paid membership is <strong>not yet available</strong>; this Policy will be revised before it launches.
      </>,
      <>Deleting your account destroys your linked personal information without delay.</>,
      <>
        Reach us anytime at{" "}
        <a href="mailto:sjses4789@gmail.com" className="underline">
          sjses4789@gmail.com
        </a>
        .
      </>,
    ],
    switchTo: "한국어로 보기",
    switchNote: "This policy is also available in Korean.",
    backHome: "Back to poroom.kr",
  },
  ko: {
    eyebrow: "개인정보처리방침",
    title: "PoRoom 개인정보처리방침",
    lede:
      "PoRoom을 운영하는 GGOZIL(이하 “운영자”)은 이용자의 개인정보를 소중히 다루며, 관계 법령을 준수합니다. 이 방침은 PoRoom이 어떤 정보를 수집·이용·보관하고, 이용자가 어떤 권리를 가지는지 설명합니다.",
    effective: "시행일",
    contact: "문의",
    tocLabel: "목차",
    summaryTitle: "한눈에 보는 요약",
    summary: [
      <>
        <strong>로그인은 구글 계정으로만</strong> 이루어지며, PoRoom은 이용자의 비밀번호를 저장하지 않습니다.
      </>,
      <>서비스 이용 중 입력하는 닉네임·채팅·기록·게시글 등은 서비스 제공 목적으로만 저장되며, 임의로 공개되지 않습니다.</>,
      <>결제 기능은 <strong>아직 도입되지 않았으며</strong>, 도입 시 별도로 이 방침을 개정해 사전 고지합니다.</>,
      <>회원 탈퇴 시 계정과 관련된 개인정보는 지체 없이 파기됩니다.</>,
      <>
        문의·열람·삭제 요청은 언제든{" "}
        <a href="mailto:sjses4789@gmail.com" className="underline">
          sjses4789@gmail.com
        </a>
        으로 받습니다.
      </>,
    ],
    switchTo: "View in English",
    switchNote: "이 방침은 영어로도 제공됩니다.",
    backHome: "poroom.kr로 돌아가기",
  },
} as const;

export function PrivacyContent() {
  const [lang, setLang] = useState<Lang>("en");
  const clauses = lang === "en" ? CLAUSES_EN : CLAUSES_KO;
  const s = STRINGS[lang];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="https://poroom.kr"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-900 dark:text-white"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />
            PoRoom
          </Link>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">poroom.kr/privacy</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-red-500">{s.eyebrow}</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          {s.title}
        </h1>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {s.lede}
        </p>
        <div className="mb-8 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {s.effective} <span className="font-medium text-neutral-700 dark:text-neutral-200">2026-08-25</span>
          </span>
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {s.contact}{" "}
            <a href="mailto:sjses4789@gmail.com" className="font-medium text-neutral-700 dark:text-neutral-200">
              sjses4789@gmail.com
            </a>
          </span>
        </div>

        <div className="mb-10 rounded-sm border border-neutral-200 border-l-2 border-l-red-400 p-5 dark:border-neutral-700 dark:border-l-red-500">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">{s.summaryTitle}</h2>
          <ul className="space-y-2">
            {s.summary.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-400" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={s.tocLabel} className="mb-10 flex flex-wrap gap-x-4 gap-y-1.5 border-y border-neutral-100 py-4 text-xs dark:border-neutral-800">
          {clauses.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="text-neutral-500 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-white"
            >
              {c.num}. {c.title}
            </a>
          ))}
        </nav>

        <div>
          {clauses.map((c, i) => (
            <section
              key={c.id}
              id={c.id}
              className={`scroll-mt-20 py-6 ${i > 0 ? "border-t border-neutral-100 dark:border-neutral-800" : "pt-0"}`}
            >
              <h2 className="mb-3 flex items-baseline gap-2 text-base font-semibold text-neutral-900 dark:text-white">
                <span className="text-red-500">{c.num}.</span> {c.title}
              </h2>
              {c.body}
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-neutral-100 pt-8 text-center dark:border-neutral-800">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{s.switchNote}</p>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "ko" : "en")}
            className="rounded-sm border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {s.switchTo}
          </button>
          <Link
            href="https://poroom.kr"
            className="mt-2 text-xs text-neutral-400 hover:text-neutral-600 hover:underline dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            ← {s.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
