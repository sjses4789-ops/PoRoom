// 애드센스 심사 기간 동안 비로그인 방문자에게만 보여주는 "예시 데이터".
//
// DB에는 아무것도 쓰지 않는다 — 이 파일이 만든 가짜 사용자/방/대결/기록/
// 피드가 각 페이지에서 실제 DB 조회 결과 뒤에 덧붙여지기만 한다. 그래서
// 지울 때도 DB를 건드릴 필요 없이 `ADSENSE_REVIEW_MODE`를 false로 바꾸거나
// 이 파일과 이 파일을 쓰는 곳(`demo-` 접두어 id를 다루는 코드)을
// 걷어내면 끝난다. 모든 id는 `demo-`로 시작해서 실제 데이터와 절대 섞이지
// 않고, 실제 DB로 보내는 쿼리(.in(...) 등)에는 `isDemoId`로 걸러서
// 넣어야 한다(uuid 컬럼에 문자열 id를 넣으면 쿼리 전체가 실패한다).
//
// 결과는 하루 단위로 고정된다(같은 날에는 새로고침해도 똑같이 보임).

import { ADSENSE_REVIEW_MODE } from "@/lib/adsense-review-mode";
import { CHARACTER_IDS } from "@/lib/characters";
import { todayKst } from "@/lib/time";
import { DEMO_ID_PREFIX, isDemoId } from "@/lib/demo-id";
import type { FeedPostMeta, PostType, ReactionType } from "@/lib/feed";

export { DEMO_ID_PREFIX, isDemoId };

// 실제 id만 남긴다 — DB(uuid 컬럼)로 보내는 .in() 조회 앞에서 쓴다.
export function withoutDemoIds(ids: string[]): string[] {
  return ids.filter((id) => !isDemoId(id));
}

// 심사 모드이면서 비로그인일 때만 예시 데이터를 보여준다 — 로그인한
// 사용자(실제 회원)에게는 절대 섞이지 않는다.
export function shouldShowDemoData(user: unknown): boolean {
  return ADSENSE_REVIEW_MODE && !user;
}

export type DemoUser = {
  id: string;
  name: string;
  character_id: string;
  position: "novelist" | "webtoon";
};

export type DemoRoom = {
  id: string;
  name: string;
  color: string;
  tags: string[];
  join_type: "open";
  target_position: "novelist" | "webtoon" | null;
  is_system: false;
  created_at: string;
};

export type DemoRecord = {
  room_id: string;
  user_id: string;
  record_date: string;
  chars: number;
  focus_minutes: number;
};

export type DemoChallenge = {
  id: string;
  title: string;
  metric: "chars" | "minutes";
  visibility: "open";
  start_date: string | null;
  end_date: string | null;
  kind: null;
  created_by: string;
  color: null;
  capacity: number;
  duration_days: number;
  started_at: string | null;
  is_admin_event: false;
  target_position: "novelist" | "webtoon" | null;
};

export type DemoFeedPost = {
  id: string;
  user_id: string;
  post_type: PostType;
  mood: string;
  focus_minutes: number;
  chars: number;
  meta: FeedPostMeta;
  created_at: string;
};

export type DemoData = {
  users: DemoUser[];
  rooms: DemoRoom[];
  memberships: { room_id: string; user_id: string }[];
  records: DemoRecord[];
  challenges: DemoChallenge[];
  challengeParticipants: { challenge_id: string; user_id: string; room_id: null }[];
  milestoneLogs: { user_id: string; type: string }[];
  typingScores: { user_id: string; cpm: number }[];
  feedPosts: DemoFeedPost[];
  feedReactions: { id: string; post_id: string; user_id: string; reaction_type: ReactionType }[];
};

const NOVELIST_NAMES = [
  "밤새는작가", "문장수집가", "라떼한잔", "초단완고러", "새벽필경사",
  "퇴고중독", "달빛서재", "연재요정", "한줄한줄", "원고지위의고양이",
  "마감요정", "서재의여우", "소설쓰는곰", "플롯장인", "느릿느릿나무늘보",
];
const WEBTOON_NAMES = [
  "콘티왕", "펜선장인", "채색요정", "스케치북", "러프한하루",
  "컷컷컷", "네임그리는밤", "작화의신", "만화방고양이", "선화수집가",
  "배경덕후", "톤작업러", "마감전야",
];

const ROOM_SPECS: {
  name: string;
  color: string;
  tags: string[];
  target: "novelist" | "webtoon" | null;
}[] = [
  { name: "마감 임박! 새벽 집필방", color: "rose", tags: ["마감", "작업위주", "웹소설"], target: "novelist" },
  { name: "웹툰 콘티 같이 짜요", color: "sky", tags: ["웹툰", "작업위주"], target: "webtoon" },
  { name: "조용히 쓰는 도서관", color: "stone", tags: ["조용한", "웹소설"], target: "novelist" },
  { name: "하루 3천자 챌린지룸", color: "amber", tags: ["웹소설", "인풋"], target: "novelist" },
  { name: "로맨스 판타지 연재방", color: "pink", tags: ["로판", "웹소설", "수다"], target: "novelist" },
  { name: "무협·퓨전 작가 모임", color: "emerald", tags: ["무협", "판타지", "모임"], target: "novelist" },
  { name: "채색 작업 몰입방", color: "violet", tags: ["웹툰", "조용한"], target: "webtoon" },
  { name: "초보 작가 응원방", color: "yellow", tags: ["지망", "수다", "20대"], target: null },
  { name: "공모전 준비반", color: "indigo", tags: ["마감", "웹소설", "지망"], target: "novelist" },
  { name: "퇴고 전문 스터디", color: "teal", tags: ["조용한", "작업위주"], target: "novelist" },
  { name: "주말 몰아쓰기 클럽", color: "orange", tags: ["모임", "인풋"], target: null },
  { name: "선화 작업 같이해요", color: "slate", tags: ["웹툰", "작업위주"], target: "webtoon" },
  { name: "BL·GL 연재 작가방", color: "fuchsia", tags: ["웹소설", "수다"], target: "novelist" },
  { name: "직장인 퇴근 후 집필", color: "blue", tags: ["30대", "작업위주"], target: null },
  { name: "대학생 작가 스터디", color: "lime", tags: ["20대", "지망", "모임"], target: null },
  { name: "장르 불문 자유방", color: "neutral", tags: ["기타", "수다"], target: null },
  { name: "스릴러·미스터리 집필방", color: "zinc", tags: ["추리", "공포", "웹소설"], target: "novelist" },
  { name: "배경 작업 전문방", color: "cyan", tags: ["웹툰", "조용한"], target: "webtoon" },
  { name: "신인 웹툰 작가 모임", color: "purple", tags: ["웹툰", "지망", "모임"], target: "webtoon" },
  { name: "오전 6시 기상 집필", color: "green", tags: ["작업위주", "조용한"], target: null },
  { name: "새해 첫 연재 도전방", color: "red", tags: ["마감", "웹소설", "인풋"], target: "novelist" },
  { name: "SF 설정 덕후 방", color: "gray", tags: ["판타지", "수다", "웹소설"], target: "novelist" },
  { name: "컷수 채우기 웹툰방", color: "emerald", tags: ["웹툰", "마감"], target: "webtoon" },
  { name: "뽀모도로 25분 집중방", color: "rose", tags: ["작업위주", "조용한"], target: null },
];

type ChallengeSpec = {
  title: string;
  metric: "chars" | "minutes";
  target: "novelist" | "webtoon" | null;
  startAgo: number;
  duration: number;
  participants: number;
};

const CHALLENGE_SPECS: ChallengeSpec[] = [
  // 이미 끝난 대결 — 승패 랭킹에 반영된다.
  { title: "일주일 5만자 달리기", metric: "chars", target: "novelist", startAgo: 30, duration: 7, participants: 4 },
  { title: "주말 이틀 집중 시간 대결", metric: "minutes", target: null, startAgo: 26, duration: 2, participants: 3 },
  { title: "3일 연속 마감 스퍼트", metric: "chars", target: "novelist", startAgo: 24, duration: 3, participants: 2 },
  { title: "웹툰 컷수 한 주 대결", metric: "chars", target: "webtoon", startAgo: 29, duration: 7, participants: 4 },
  { title: "퇴고 마라톤 10일", metric: "minutes", target: "novelist", startAgo: 40, duration: 10, participants: 3 },
  { title: "새벽 집중 시간왕", metric: "minutes", target: null, startAgo: 21, duration: 5, participants: 4 },
  { title: "웹툰 콘티 속도전", metric: "chars", target: "webtoon", startAgo: 18, duration: 4, participants: 3 },
  { title: "월간 연재 스퍼트", metric: "chars", target: "novelist", startAgo: 45, duration: 14, participants: 4 },
  { title: "이번 달 몰입 시간 대결", metric: "minutes", target: null, startAgo: 15, duration: 7, participants: 3 },
  { title: "신인 작가 글자수 대결", metric: "chars", target: "novelist", startAgo: 12, duration: 5, participants: 2 },
  { title: "컷수 채우기 서바이벌", metric: "chars", target: "webtoon", startAgo: 14, duration: 6, participants: 4 },
  { title: "하루 집중 4시간 챌린지", metric: "minutes", target: null, startAgo: 9, duration: 3, participants: 2 },
  { title: "마감 전야 올인 대결", metric: "chars", target: "novelist", startAgo: 8, duration: 4, participants: 3 },
  { title: "웹툰 채색 시간 대결", metric: "minutes", target: "webtoon", startAgo: 11, duration: 5, participants: 3 },
  // 진행 중
  { title: "이번 주 글자수 대결", metric: "chars", target: "novelist", startAgo: 3, duration: 7, participants: 3 },
  { title: "웹툰 컷수 레이스", metric: "chars", target: "webtoon", startAgo: 2, duration: 7, participants: 3 },
  { title: "주중 집중 시간 대결", metric: "minutes", target: null, startAgo: 1, duration: 5, participants: 4 },
  { title: "연휴 몰아쓰기 대결", metric: "chars", target: "novelist", startAgo: 0, duration: 4, participants: 2 },
  // 시작 전(상대 모집 중)
  { title: "한 달 완고 대결", metric: "chars", target: "novelist", startAgo: -1, duration: 30, participants: 1 },
  { title: "새벽 집중 대결", metric: "minutes", target: null, startAgo: -1, duration: 7, participants: 1 },
  // 승패 랭킹이 한쪽에 몰리지 않도록, 이미 끝난 대결을 더 깔아둔다.
  ...Array.from({ length: 16 }, (_, k): ChallengeSpec => {
    const kind = k % 3;
    const label = ["주간", "주말", "월말", "새벽", "퇴근 후"][k % 5];
    return {
      title:
        kind === 0
          ? `${label} 글자수 대결 #${k + 1}`
          : kind === 1
            ? `${label} 컷수 대결 #${k + 1}`
            : `${label} 집중 시간 대결 #${k + 1}`,
      metric: kind === 2 ? "minutes" : "chars",
      target: kind === 0 ? "novelist" : kind === 1 ? "webtoon" : null,
      startAgo: 55 - k * 3,
      duration: 3 + (k % 5),
      participants: 2 + (k % 3),
    };
  }),
];

const WRITE_MOODS = [
  "오늘은 새벽 5시에 일어나서 3천자 썼어요. 이 맛에 연재합니다.",
  "뽀모도로 4세트 완료! 어깨가 뻐근하지만 뿌듯해요.",
  "막혀 있던 3화 전개를 드디어 뚫었습니다 🎉",
  "퇴근하고 카페에서 두 시간 집필. 오늘도 출석 체크!",
  "콘티 20컷 완성. 내일은 선화 들어갑니다.",
  "배경 작업이 이렇게 오래 걸릴 줄이야… 그래도 한 장면 끝!",
  "주인공 대사 고치다가 한 시간이 지나갔어요. 퇴고는 끝이 없네요.",
  "글이 안 써지는 날. 그래도 500자라도 썼다는 데 의미를 둡니다.",
  "오늘의 목표 달성! 이제 따뜻한 차 한 잔 마시러 갑니다.",
  "이번 화 엔딩을 바꿨더니 훨씬 낫네요. 독자분들 반응이 기대돼요.",
  "집중이 잘 되는 날이라 25분 세 번을 쉬지 않고 돌렸어요.",
  "러프 스케치만 하루 종일… 그래도 구도가 마음에 들어요.",
  "다른 분들이 열심히 하시는 걸 보니 저절로 자리에 앉게 되네요.",
  "복선 하나를 회수했습니다. 3개월 전에 깔아둔 건데 이제야!",
  "채색 톤을 바꿔봤는데 분위기가 확 살아났어요.",
  "점심시간 30분 집중 완료. 직장인 작가의 하루는 짧습니다.",
  "오늘은 자료조사만 했지만 내일 쓸 장면이 선명해졌어요.",
  "마감 이틀 전인데 오히려 마음이 편해요. 초안은 끝났거든요.",
  "펜터치 8컷 끝! 손목 스트레칭 하고 다시 달립니다.",
  "한 화 분량을 처음으로 하루에 완성했어요. 스스로 칭찬 중.",
  "새벽 방에서 같이 글 쓰는 분들 덕분에 졸음이 달아났습니다.",
  "플롯 노트를 다시 정리했더니 앞으로 10화가 보입니다.",
  "연재 100일 차! 꾸준함이 제일 어렵고 제일 값져요.",
  "오늘은 쉬엄쉬엄. 1시간만 집중하고 산책하고 왔습니다.",
];
// 직업에 안 맞는 말(웹툰 작가가 "글이 안 써진다" 등)이 나오지 않게 가른다.
const WEBTOON_ONLY = /콘티|러프|채색|배경 작업|펜터치|선화|컷/;
const NOVELIST_ONLY = /글|퇴고|플롯|복선|엔딩|대사|연재|초안|천자|한 화|독자|장면/;
const writeMoodsFor = (position: "novelist" | "webtoon") =>
  WRITE_MOODS.filter((m) =>
    position === "webtoon" ? WEBTOON_ONLY.test(m) || !NOVELIST_ONLY.test(m) : !WEBTOON_ONLY.test(m)
  );

const DUEL_MOODS = [
  "접전이었는데 아쉽게 2위! 다음엔 꼭 이깁니다.",
  "대결 끝났습니다. 상대방분 수고 많으셨어요!",
  "마지막 날 몰아쓰기로 역전승 🔥",
  "승부 덕분에 평소보다 두 배는 쓴 것 같아요.",
  "졌지만 기록 갱신했으니 만족합니다.",
  "치열했던 한 주였어요. 다음 대결도 기대할게요.",
];
const CHALLENGE_MOODS = [
  "이번 주도 매일 5천자 성공! 꾸준함이 제일 무섭다는 걸 느낍니다.",
  "오늘 5천자 달성했어요. 연속 기록 이어갑니다.",
  "이번 달 초단 1완고 챌린지 성공! 드디어 한 편 끝냈어요.",
  "1만자 챌린지는 역시 쉽지 않네요. 그래도 해냈습니다.",
  "아쉽게도 오늘은 실패. 내일 다시 도전합니다.",
];
const SUBMISSION_MOODS = [
  "드디어 출판사 세 곳에 투고했어요. 떨리네요…",
  "투고 완료! 답장 기다리는 동안 다음 작품 쓰고 있겠습니다.",
  "오랜 퇴고 끝에 투고했습니다. 좋은 소식 있기를!",
];
const CONTEST_MOODS = [
  "공모전 응모 완료! 결과와 상관없이 완주한 것만으로 큰 경험이에요.",
  "마감 5분 전에 제출했습니다… 심장 떨려서 혼났네요.",
  "이번 공모전을 목표로 석 달 동안 달렸어요. 응모 끝!",
];
const GENRES = ["로맨스 판타지", "현대 판타지", "무협", "웹툰 스토리", "스릴러"];
const CONTEST_NAMES = ["봄맞이 웹소설 공모전", "신인 웹툰 작가 공모전", "단편소설 챌린지 공모전", "장르문학 신인상"];
const PASTEL_BG = ["#FBE7E9", "#FCE8DC", "#FBF3D3", "#EAF4D8", "#DCF2E6", "#D9F0F4", "#DCEBFB", "#E6E2FB"];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

function build(today: string): DemoData {
  const rng = mulberry32(Number(today.replaceAll("-", "")));
  const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(rng() * list.length)];
  const shuffle = <T,>(list: readonly T[]): T[] => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // --- 사용자 ---
  const users: DemoUser[] = [
    ...NOVELIST_NAMES.map((name, i) => ({ name, position: "novelist" as const, i })),
    ...WEBTOON_NAMES.map((name, i) => ({ name, position: "webtoon" as const, i: i + NOVELIST_NAMES.length })),
  ].map(({ name, position, i }) => ({
    id: `${DEMO_ID_PREFIX}user-${pad(i + 1)}`,
    name,
    character_id: CHARACTER_IDS[(i * 5 + 3) % CHARACTER_IDS.length],
    position,
  }));
  const usersFor = (target: "novelist" | "webtoon" | null) =>
    target ? users.filter((u) => u.position === target) : users;

  // --- 방 ---
  const rooms: DemoRoom[] = ROOM_SPECS.map((spec, i) => ({
    id: `${DEMO_ID_PREFIX}room-${pad(i + 1)}`,
    name: spec.name,
    color: spec.color,
    tags: spec.tags,
    join_type: "open",
    target_position: spec.target,
    is_system: false,
    created_at: `${addDays(today, -(60 - i * 2))}T09:00:00+09:00`,
  }));

  const memberships: { room_id: string; user_id: string }[] = [];
  const roomsByUser = new Map<string, string[]>();
  const addMember = (roomId: string, userId: string) => {
    memberships.push({ room_id: roomId, user_id: userId });
    roomsByUser.set(userId, [...(roomsByUser.get(userId) ?? []), roomId]);
  };
  rooms.forEach((room) => {
    const pool = shuffle(usersFor(room.target_position));
    const count = Math.min(pool.length, int(5, 11));
    pool.slice(0, count).forEach((u) => addMember(room.id, u.id));
  });
  for (const u of users) {
    if (roomsByUser.has(u.id)) continue;
    const room = pick(rooms.filter((r) => !r.target_position || r.target_position === u.position));
    addMember(room.id, u.id);
  }

  // --- 최근 60일 기록 ---
  const skillByUser = new Map(users.map((u) => [u.id, 0.55 + rng() * 1.15]));
  const records: DemoRecord[] = [];
  for (const u of users) {
    const myRooms = roomsByUser.get(u.id) ?? [];
    const skill = skillByUser.get(u.id) ?? 1;
    for (let d = 0; d < 60; d++) {
      const attendRate = d === 0 ? 0.65 : 0.72;
      if (rng() > attendRate) continue;
      const amount =
        u.position === "webtoon"
          ? Math.max(1, Math.round(int(2, 9) * skill))
          : Math.round((int(1200, 6500) * skill) / 10) * 10;
      records.push({
        room_id: pick(myRooms),
        user_id: u.id,
        record_date: addDays(today, -d),
        chars: amount,
        focus_minutes: Math.round((int(30, 220) * (0.7 + skill * 0.4)) / 5) * 5,
      });
    }
  }

  // --- 대결 ---
  const challenges: DemoChallenge[] = [];
  const challengeParticipants: DemoData["challengeParticipants"] = [];
  CHALLENGE_SPECS.forEach((spec, i) => {
    const id = `${DEMO_ID_PREFIX}duel-${pad(i + 1)}`;
    const pending = spec.startAgo < 0;
    const start = pending ? null : addDays(today, -spec.startAgo);
    const end = start ? addDays(start, spec.duration - 1) : null;
    const joinedUsers = shuffle(usersFor(spec.target)).slice(0, spec.participants);
    challenges.push({
      id,
      title: spec.title,
      metric: spec.metric,
      visibility: "open",
      start_date: start,
      end_date: end,
      kind: null,
      created_by: joinedUsers[0].id,
      color: null,
      capacity: Math.max(spec.participants, 4),
      duration_days: spec.duration,
      started_at: start ? `${start}T00:00:00+09:00` : null,
      is_admin_event: false,
      target_position: spec.target,
    });
    for (const u of joinedUsers) {
      challengeParticipants.push({ challenge_id: id, user_id: u.id, room_id: null });
    }
  });

  // --- 챌린지 성공 기록(챌린지 랭킹용) / 타자 연습 기록 ---
  const milestoneLogs: DemoData["milestoneLogs"] = [];
  for (const u of users) {
    const skill = skillByUser.get(u.id) ?? 1;
    const fives = Math.round(int(2, 18) * skill);
    const tens = Math.round(int(0, 8) * skill);
    const drafts = Math.round(int(0, 3) * skill);
    for (let i = 0; i < fives; i++) milestoneLogs.push({ user_id: u.id, type: "milestone_5k" });
    for (let i = 0; i < tens; i++) milestoneLogs.push({ user_id: u.id, type: "milestone_10k" });
    for (let i = 0; i < drafts; i++) milestoneLogs.push({ user_id: u.id, type: "draft_done" });
  }
  const typingScores: DemoData["typingScores"] = users.map((u) => ({
    user_id: u.id,
    cpm: Math.round(260 + (skillByUser.get(u.id) ?? 1) * 190 + int(0, 140)),
  }));

  // --- 피드 ---
  const FEED_COUNTS: { type: PostType; count: number }[] = [
    { type: "write", count: 32 },
    { type: "duel", count: 10 },
    { type: "challenge", count: 10 },
    { type: "submission", count: 6 },
    { type: "contest", count: 6 },
  ];
  const typeOrder = shuffle(FEED_COUNTS.flatMap((c) => Array<PostType>(c.count).fill(c.type)));
  const now = Date.now();
  let minutesAgo = int(8, 40);
  const feedPosts: DemoFeedPost[] = typeOrder.map((type, i) => {
    const author = pick(users);
    const meta: FeedPostMeta = {};
    let mood = "";
    let focus = 0;
    let amount = 0;
    if (type === "write") {
      mood = pick(writeMoodsFor(author.position));
      focus = pick([25, 50, 75, 100, 125, 150, 200]);
      amount =
        author.position === "webtoon" ? int(3, 14) : Math.round(int(900, 7200) / 10) * 10;
    } else if (type === "duel") {
      mood = pick(DUEL_MOODS);
      const participantCount = pick([2, 2, 3, 4]);
      const rank = int(1, participantCount);
      meta.challengeTitle = pick(CHALLENGE_SPECS.slice(0, 14)).title;
      meta.participantCount = participantCount;
      meta.rank = rank;
      meta.result = rank === 1 ? "win" : "loss";
    } else if (type === "challenge") {
      mood = pick(CHALLENGE_MOODS);
      const draft = mood.includes("초단");
      meta.challengeTitle = draft
        ? "매 달 초단 1완고 챌린지"
        : mood.includes("1만자")
          ? "매일 1만자 쓰기 챌린지"
          : "매일 5천자 쓰기 챌린지";
      meta.kind = draft ? "monthly_draft" : mood.includes("1만자") ? "daily10k" : "daily5k";
      meta.achieved = !mood.includes("실패");
    } else if (type === "submission") {
      mood = pick(SUBMISSION_MOODS);
      meta.publisherCount = int(1, 5);
      meta.genre = pick(GENRES);
    } else {
      mood = pick(CONTEST_MOODS);
      meta.contestName = pick(CONTEST_NAMES);
      meta.contestMode = "chars";
      meta.contestChars = Math.round(int(20000, 120000) / 100) * 100;
    }
    if (type === "write" && rng() < 0.4) meta.bgColor = pick(PASTEL_BG);

    const post: DemoFeedPost = {
      id: `${DEMO_ID_PREFIX}post-${pad(i + 1, 3)}`,
      user_id: author.id,
      post_type: type,
      mood,
      focus_minutes: focus,
      chars: amount,
      meta,
      created_at: new Date(now - minutesAgo * 60000).toISOString(),
    };
    minutesAgo += int(60, 330);
    return post;
  });

  const REACTION_TYPES: ReactionType[] = ["heart", "clap", "fire"];
  const feedReactions: DemoData["feedReactions"] = [];
  for (const post of feedPosts) {
    for (const type of REACTION_TYPES) {
      const reactors = shuffle(users).slice(0, int(0, type === "heart" ? 9 : 6));
      for (const u of reactors) {
        feedReactions.push({
          id: `${post.id}-${type}-${u.id}`,
          post_id: post.id,
          user_id: u.id,
          reaction_type: type,
        });
      }
    }
  }

  return {
    users,
    rooms,
    memberships,
    records,
    challenges,
    challengeParticipants,
    milestoneLogs,
    typingScores,
    feedPosts,
    feedReactions,
  };
}

let cache: { today: string; data: DemoData } | null = null;

export function getDemoData(): DemoData {
  const today = todayKst();
  if (!cache || cache.today !== today) cache = { today, data: build(today) };
  return cache.data;
}

// ---------------------------------------------------------------------
// 예시 방 내부 화면(/room/demo-room-xx)에 쓰는 정적 데이터
// ---------------------------------------------------------------------

export type DemoRoomMember = {
  id: string;
  name: string;
  characterId: string;
  position: "novelist" | "webtoon";
  isOwner: boolean;
  presence: "typing" | "idle" | "offline";
  phase: "focus" | "break" | "idle";
  elapsedFraction: number;
  workStatus: string | null;
  todayChars: number;
  focusMinutes: number;
  lastSeenLabel: string | null;
};

export type DemoRoomMessage = { id: string; userId: string; name: string; content: string; minutesAgo: number };

export type DemoRoomPost = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  category: "공지사항" | "정보 공유" | "팁 전수" | "자유";
  pinned: boolean;
};

export type DemoRoomDetail = {
  room: DemoRoom;
  members: DemoRoomMember[];
  messages: DemoRoomMessage[];
  posts: DemoRoomPost[];
};

const NOVELIST_STATUS = ["집필중", "퇴고중", "구상중", "자료조사", "휴식 중"];
const WEBTOON_STATUS = ["콘티", "스케치", "펜터치", "채색", "배경", "후편집"];

const CHAT_LINES = [
  "안녕하세요! 오늘도 같이 달려봐요 💪",
  "저는 지금 3세트째 돌리는 중이에요",
  "방금 한 장면 끝냈어요. 다들 어떠세요?",
  "커피 한 잔 하고 다시 시작합니다 ☕",
  "오늘 목표는 4천자! 반쯤 왔네요",
  "집중 시간 끝나면 스트레칭 같이 해요",
  "마감이 코앞인데 마음이 급하네요 ㅠㅠ",
  "여기 있으면 이상하게 집중이 잘 돼요",
  "다들 화이팅입니다! 조금만 더 힘내요",
  "저는 이제 휴식 시간~ 잠깐 눈 좀 쉬어야겠어요",
  "막혔던 장면 드디어 풀렸어요 🎉",
  "배경 작업만 하다 보니 하루가 다 갔네요",
];

export function getDemoRoomDetail(roomId: string): DemoRoomDetail | null {
  const data = getDemoData();
  const room = data.rooms.find((r) => r.id === roomId);
  if (!room) return null;

  const rng = mulberry32(Number(roomId.replace(/\D/g, "")) * 7919 + 13);
  const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(rng() * list.length)];

  const userById = new Map(data.users.map((u) => [u.id, u]));
  const today = todayKst();
  const memberIds = data.memberships.filter((m) => m.room_id === roomId).map((m) => m.user_id);

  const members: DemoRoomMember[] = memberIds.map((id, i) => {
    const u = userById.get(id)!;
    const presence: DemoRoomMember["presence"] = i < 3 ? "typing" : i < 5 ? "idle" : "offline";
    const phase: DemoRoomMember["phase"] =
      presence === "offline" ? "idle" : pick(["focus", "focus", "focus", "break"] as const);
    const todayRecord = data.records
      .filter((r) => r.user_id === id && r.record_date === today)
      .reduce((sum, r) => sum + r.chars, 0);
    const focus = data.records
      .filter((r) => r.user_id === id && r.record_date === today && r.room_id === roomId)
      .reduce((sum, r) => sum + r.focus_minutes, 0);
    return {
      id,
      name: u.name,
      characterId: u.character_id,
      position: u.position,
      isOwner: i === 0,
      presence,
      phase,
      elapsedFraction: presence === "offline" ? 0 : int(8, 92) / 100,
      workStatus:
        presence === "offline" ? null : pick(u.position === "webtoon" ? WEBTOON_STATUS : NOVELIST_STATUS),
      todayChars: todayRecord,
      focusMinutes: focus,
      lastSeenLabel: presence === "offline" ? `${int(1, 20)}시간 전` : null,
    };
  });

  const talkers = members.filter((m) => m.presence !== "offline");
  // 같은 방 안에서 대사가 겹치지 않도록 시작 위치만 방마다 다르게 두고 순서대로 쓴다.
  const lineOffset = int(0, CHAT_LINES.length - 1);
  const messages: DemoRoomMessage[] = Array.from({ length: 10 }, (_, i) => {
    const speaker = talkers[i % Math.max(talkers.length, 1)] ?? members[0];
    return {
      id: `${roomId}-msg-${i}`,
      userId: speaker.id,
      name: speaker.name,
      content: CHAT_LINES[(lineOffset + i) % CHAT_LINES.length],
      minutesAgo: (10 - i) * int(2, 6),
    };
  });

  const owner = members[0];
  const posts: DemoRoomPost[] = [
    {
      id: `${roomId}-post-1`,
      title: "방 이용 안내",
      content: `${room.name}에 오신 것을 환영합니다. 서로의 집중을 방해하지 않는 선에서 가볍게 응원해 주세요. 뽀모도로 25분 집중 후 5분 휴식을 기본으로 합니다.`,
      authorName: owner.name,
      category: "공지사항",
      pinned: true,
    },
    {
      id: `${roomId}-post-2`,
      title: "이번 주 목표 공유해요",
      content: "각자 이번 주에 끝내고 싶은 분량을 댓글 대신 채팅으로 적어주세요. 금요일 저녁에 같이 점검해 봐요.",
      authorName: members[1]?.name ?? owner.name,
      category: "자유",
      pinned: false,
    },
    {
      id: `${roomId}-post-3`,
      title: "집중이 안 될 때 쓰는 방법",
      content: "타이머를 15분으로 줄이고 일단 시작하기. 시작만 하면 의외로 25분이 금방 갑니다. 막힌 장면은 건너뛰고 쓰기 쉬운 장면부터 써보세요.",
      authorName: members[2]?.name ?? owner.name,
      category: "팁 전수",
      pinned: false,
    },
  ];

  return { room, members, messages, posts };
}
