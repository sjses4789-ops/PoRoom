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

// ---------------------------------------------------------------------
// [휴식] 게시판 예시 글 — [정보] / [인원 모집]
// ---------------------------------------------------------------------

export type DemoRestPost = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  category: "정보" | "인원 모집";
  room_id: string | null;
  info_category: "팁&노하우" | "공모전" | "질문" | "기타" | null;
  pinned: boolean;
};

const INFO_POSTS: {
  info: NonNullable<DemoRestPost["info_category"]>;
  title: string;
  content: string;
  pinned?: boolean;
}[] = [
  {
    info: "기타",
    pinned: true,
    title: "포룸 200% 활용하기: 방·피드·도전·랭킹 사용법",
    content:
      "포룸은 화상회의 없이 같이 집중하는 온라인 뽀모도로 스터디룸입니다.\n\n1. [포룸] 탭에서 마음에 드는 방에 입장하세요. 입장하면 참여자 카드와 채팅, 뽀모도로 타이머가 열립니다.\n2. 집중이 끝나면 오늘 쓴 글자 수(웹툰은 컷 수)를 기록해 두세요. 기록은 [랭킹]에 반영됩니다.\n3. [피드]에는 오늘의 작업을 한 줄로 남길 수 있고, 다른 작가분들의 글에 응원 반응을 눌러줄 수 있어요.\n4. [도전]에서는 1:1 대결이나 매일 5천자 챌린지에 참여할 수 있습니다.\n\n처음에는 방 하나에 들어가 25분만 돌려 보는 것부터 시작해 보세요.",
  },
  {
    info: "팁&노하우",
    title: "뽀모도로 25분이 안 맞을 때: 시간 조절 가이드",
    content:
      "25분 집중이 너무 짧게 느껴지거나, 반대로 너무 길어서 중간에 딴짓을 하게 된다면 시간을 바꿔도 괜찮습니다.\n\n- 몰입이 오래 가는 작업(초고 쓰기): 40~50분 집중 + 10분 휴식\n- 집중이 잘 끊기는 작업(퇴고, 자료 조사): 15~20분 집중 + 5분 휴식\n- 컨디션이 안 좋은 날: 15분만 앉아 보기\n\n중요한 건 숫자가 아니라 '쉬는 시간을 지키는 것'입니다. 일주일 정도 써 보고 가장 편한 조합을 찾아보세요.",
  },
  {
    info: "팁&노하우",
    title: "초고를 끝까지 쓰는 '일단 완주' 원칙",
    content:
      "초고를 못 끝내는 가장 큰 이유는 앞부분을 계속 고치기 때문입니다.\n\n1. 초고에서는 어색한 문장이 보여도 [] 메모만 남기고 앞으로 나아갑니다.\n2. 막히는 장면은 '여기서 두 사람이 싸운다'처럼 한 줄만 적고 다음 장면으로 넘어갑니다.\n3. 목표 분량을 채우기 전에는 처음으로 돌아가지 않습니다.\n\n끝까지 쓴 글은 고칠 수 있지만, 쓰다 만 글은 고칠 수조차 없습니다.",
  },
  {
    info: "팁&노하우",
    title: "웹툰 콘티 단계에서 컷 수를 줄이는 요령",
    content:
      "콘티에서 컷이 자꾸 늘어나는 건 '한 컷에 한 정보'만 담으려는 습관 때문일 때가 많습니다.\n\n- 대사가 이어지는 장면은 한 컷 안에 말풍선을 나눠 담아 보기\n- 같은 구도가 3컷 이상 이어지면 하나로 합칠 수 있는지 검토하기\n- 감정이 큰 장면에만 컷을 아낌없이 쓰고, 이동·설명 장면은 압축하기\n\n컷 수를 줄이면 작업 시간도 줄고, 독자에게는 호흡이 빠른 화로 읽힙니다.",
  },
  {
    info: "팁&노하우",
    title: "연재 첫 한 달, 독자 반응을 정리하는 법",
    content:
      "연재 초반에는 댓글 하나하나에 일희일비하기 쉽습니다. 저는 주 1회, 정해둔 시간에만 반응을 정리합니다.\n\n1. 자주 나오는 칭찬 포인트(캐릭터, 분위기, 전개 속도)를 3개 적는다.\n2. 반복되는 아쉬움(설명 과다, 전개 지연 등)을 3개 적는다.\n3. 다음 주 원고에 반영할 것을 하나만 고른다.\n\n한 번에 많이 고치려 하지 않는 것이 핵심입니다.",
  },
  {
    info: "팁&노하우",
    title: "작업 환경 점검: 조명·모니터 높이·의자",
    content:
      "장시간 작업하는 작가에게 환경 세팅은 생산성과 직결됩니다.\n\n- 모니터 상단이 눈높이와 비슷하거나 살짝 아래에 오도록 조정\n- 화면과 주변 밝기 차이가 크지 않게 간접 조명 켜기\n- 팔꿈치가 90도 정도로 편하게 놓이는 책상 높이 맞추기\n- 한 시간에 한 번은 일어나서 걷기\n\n작은 변화지만 일주일만 해 봐도 피로도가 달라집니다.",
  },
  {
    info: "공모전",
    title: "공모전 제출 전 최종 점검 체크리스트",
    content:
      "마감에 쫓겨 사소한 실수로 아쉽게 탈락하지 않도록 제출 전에 확인해 보세요.\n\n□ 모집 요강(분량, 장르, 중복 투고 가능 여부)을 다시 읽었는가\n□ 파일 형식과 파일명 규칙이 맞는가\n□ 시놉시스에 결말까지 들어 있는가\n□ 첫 화(첫 3화)를 한 번 더 퇴고했는가\n□ 맞춤법 검사와 인물 이름 표기 통일을 했는가\n□ 연락처가 정확한가\n□ 마감 하루 전에 제출했는가",
  },
  {
    info: "공모전",
    title: "시놉시스 한 페이지로 쓰는 방법",
    content:
      "시놉시스는 이야기를 '요약'하는 글이 아니라 '설득'하는 글입니다. 한 페이지 안에 아래 순서를 넣어 보세요.\n\n1. 한 줄 소개: 누가, 무엇을 원하고, 무엇이 방해하는가\n2. 배경과 주요 인물 2~3명\n3. 사건의 흐름: 도입 → 갈등 고조 → 전환점 → 결말\n4. 이 작품만의 매력 한 문장\n\n결말을 숨기지 말고 분명히 적는 편이 심사자에게 신뢰를 줍니다.",
  },
  {
    info: "공모전",
    title: "투고 메일에 꼭 들어가야 할 것들",
    content:
      "출판사나 플랫폼에 투고할 때 메일 본문은 짧고 분명할수록 좋습니다.\n\n- 제목: [투고] 작품명 / 장르 / 필명\n- 본문: 작품 한 줄 소개, 총 분량(화수·자수), 연재 이력 유무, 연락처\n- 첨부: 요구한 형식의 원고 + 시놉시스\n\n투고처마다 양식이 다르니 반드시 해당 사이트의 안내를 먼저 확인하세요.",
  },
  {
    info: "질문",
    title: "슬럼프가 올 때 다들 어떻게 하세요?",
    content:
      "요즘 2주째 글이 거의 안 써집니다. 목표량을 평소의 3분의 1로 줄이고, 산책하면서 장면만 구상해 보고 있는데 아직은 잘 모르겠어요.\n\n쉬는 게 답인지, 억지로라도 쓰는 게 답인지 궁금합니다. 경험담이든 짧은 팁이든 편하게 남겨 주세요.",
  },
  {
    info: "질문",
    title: "하루에 뽀모도로 몇 세트 돌리는 게 적당할까요?",
    content:
      "직장을 다니면서 연재 중인데 퇴근 후에 쓸 수 있는 시간이 두세 시간 정도입니다. 보통 3세트 정도 돌리는데, 다들 하루에 몇 세트 정도 하시는지 궁금해요.\n\n세트 수가 늘어날수록 집중도가 떨어지는 느낌이라 적정선을 알고 싶습니다.",
  },
  {
    info: "질문",
    title: "맞춤법 검사기 어떤 걸 쓰세요?",
    content:
      "퇴고 마지막 단계에서 맞춤법을 점검하려고 하는데, 검사기마다 결과가 조금씩 달라서 헷갈립니다.\n\n여러 개를 같이 돌리시는지, 혹은 믿고 쓰시는 검사기가 있는지 알려주세요. 인물 이름 같은 고유명사 처리 방법도 궁금합니다.",
  },
  {
    info: "기타",
    title: "작업 BGM 추천 모음 (가사 없는 곡 위주)",
    content:
      "가사가 있는 노래는 글을 쓸 때 집중을 흩트릴 때가 많아서, 저는 아래 종류를 번갈아 듣습니다.\n\n- 잔잔한 피아노 연주곡\n- 빗소리·카페 소음 같은 환경음\n- 로파이 계열 인스트루멘탈\n- 게임 OST(전투 음악 말고 마을 음악)\n\n여러분의 작업 BGM도 댓글 대신 이 글에 이어서 공유해 주세요.",
  },
  {
    info: "기타",
    title: "마감 전날 컨디션 관리 체크포인트",
    content:
      "마감 전날에는 작업량도 많지만 컨디션 관리가 더 중요합니다.\n\n1. 최소 수면 시간을 먼저 정해 놓기\n2. 물과 간단한 간식을 책상 옆에 준비하기\n3. 50분 작업 후 10분은 반드시 화면에서 눈 떼기\n4. 제출 전에는 마지막 한 번만 훑어보고, 이후에는 고치지 않기\n\n마감 후 하루는 아무것도 안 하는 날로 비워두면 다음 작업이 훨씬 가벼워집니다.",
  },
];

const RECRUIT_POSTS: { roomNo: number; title: string; content: string }[] = [
  {
    roomNo: 1,
    title: "새벽 5시 집필 스터디 같이 하실 분 모집합니다",
    content:
      "평일 새벽 5시부터 7시까지 같이 뽀모도로를 돌리는 방입니다. 서로 말은 거의 하지 않고 조용히 집중하며, 끝날 때 오늘 쓴 분량만 한 줄로 공유해요.\n\n- 대상: 웹소설 작가(지망생 포함)\n- 시간: 평일 05:00~07:00\n- 분위기: 조용하고 꾸준한 편\n\n아래 방 링크로 입장하시면 됩니다.",
  },
  {
    roomNo: 2,
    title: "웹툰 콘티 같이 짜실 작가님 구해요",
    content:
      "혼자 콘티를 짜다 보면 컷 배치가 막힐 때가 많아서, 같은 시간에 콘티 작업을 하고 서로 막힌 부분을 가볍게 이야기할 분을 찾습니다.\n\n- 대상: 웹툰 작가(지망생 포함)\n- 시간: 주 3회 저녁 8~10시\n- 진행: 25분 작업 + 5분 휴식, 필요하면 러프 컷 공유",
  },
  {
    roomNo: 3,
    title: "조용히 쓰는 분 환영합니다 — 도서관 방",
    content:
      "채팅이 거의 없는 방을 원하시는 분께 추천드립니다. 도서관처럼 각자 자기 글에만 집중해요.\n\n- 채팅은 시작/종료 인사 정도만\n- 휴식 시간에만 가볍게 대화\n- 소음 없이 오래 앉아 있고 싶은 분 환영",
  },
  {
    roomNo: 4,
    title: "하루 3천자 챌린지 같이 하실 분",
    content:
      "하루 3천자를 목표로 꾸준히 쓰는 방입니다. 못 채운 날도 괜찮고, 다음 날 다시 이어가는 걸 목표로 합니다.\n\n- 매일 밤 오늘의 글자 수를 방 채팅에 한 줄로 남기기\n- 일주일에 한 번 서로 응원 메시지 남기기\n- 부담 없이 꾸준히 하고 싶은 분 환영",
  },
  {
    roomNo: 5,
    title: "로맨스 판타지 작가님들 신규 멤버 모집",
    content:
      "로맨스 판타지를 쓰는 작가들이 모인 방입니다. 설정 고민이나 호칭·세계관 아이디어를 가볍게 나누고, 작업 시간에는 각자 집중합니다.\n\n- 장르: 로맨스 판타지, 로맨스\n- 분위기: 수다 반, 작업 반\n- 합평은 원할 때만 진행",
  },
  {
    roomNo: 9,
    title: "공모전 준비반 — 이번 시즌 같이 달리실 분",
    content:
      "공모전 마감을 앞둔 분들이 모여 서로의 진행 상황을 공유하는 방입니다.\n\n- 주 1회 진행 상황 체크(분량, 시놉시스, 퇴고 단계)\n- 제출 전 체크리스트 같이 점검\n- 마감 전날에는 서로 응원하기",
  },
  {
    roomNo: 10,
    title: "퇴고 스터디 — 같이 고쳐 쓰실 분",
    content:
      "초고를 끝낸 뒤 퇴고에서 막히는 분들을 위한 방입니다. 구조 → 장면 → 문장 순서로 같이 고쳐 나가요.\n\n- 서로의 글을 읽고 큰 흐름만 피드백(원하는 분만)\n- 퇴고 체크리스트 공유\n- 조용히 작업하는 시간 위주로 운영",
  },
  {
    roomNo: 11,
    title: "주말 몰아쓰기 클럽 멤버 모집",
    content:
      "평일에는 바빠서 주말에 몰아서 쓰는 분들의 모임입니다. 토요일·일요일 오후에 4~6세트씩 같이 돌려요.\n\n- 시간: 주말 오후 2~7시 사이 자유 참여\n- 직업·장르 무관\n- 끝나고 한 줄 후기 공유",
  },
  {
    roomNo: 12,
    title: "선화 작업 같이 하실 웹툰 작가님",
    content:
      "선화는 반복 작업이라 지루하기 쉽습니다. 같이 시간을 맞춰 작업하면 훨씬 오래 앉아 있을 수 있어요.\n\n- 대상: 웹툰 작가\n- 진행: 50분 작업 + 10분 스트레칭\n- 작업 BGM 공유 환영",
  },
  {
    roomNo: 14,
    title: "직장인 퇴근 후 집필 모임",
    content:
      "퇴근 후 저녁 시간에 두세 시간 집중하는 직장인 작가분들의 방입니다.\n\n- 시간: 평일 20:00~23:00 (자유 입퇴장)\n- 목표: 하루 2~3세트\n- 피곤한 날은 15분만 해도 인정!",
  },
  {
    roomNo: 19,
    title: "신인 웹툰 작가 모임 멤버 구해요",
    content:
      "아직 데뷔 전이거나 연재 초반인 웹툰 작가분들의 모임입니다. 공모전, 투고, 작업 환경 정보를 나누고 서로의 마감을 응원해요.\n\n- 정보 공유 위주, 합평은 선택\n- 주 1회 이번 주 작업 목표 공유",
  },
  {
    roomNo: 24,
    title: "뽀모도로 25분 집중방 — 같이 타이머 돌리실 분",
    content:
      "기본 25분 집중 + 5분 휴식 리듬을 정확히 지키는 방입니다. 직업과 장르는 상관없고, 시간 맞춰 같이 돌리는 걸 좋아하시는 분 환영합니다.\n\n- 휴식 시간에는 스트레칭 인증\n- 4세트 후 긴 휴식 15분",
  },
];

export function getDemoRestPosts(): DemoRestPost[] {
  const data = getDemoData();
  const now = Date.now();
  const hour = 3600 * 1000;
  const posts: DemoRestPost[] = [];

  INFO_POSTS.forEach((p, i) => {
    posts.push({
      id: `${DEMO_ID_PREFIX}rest-info-${pad(i + 1)}`,
      user_id: data.users[(i * 3 + 1) % data.users.length].id,
      title: p.title,
      content: p.content,
      created_at: new Date(now - (6 + i * 19) * hour).toISOString(),
      category: "정보",
      room_id: null,
      info_category: p.info,
      pinned: p.pinned ?? false,
    });
  });

  RECRUIT_POSTS.forEach((p, i) => {
    const roomId = `${DEMO_ID_PREFIX}room-${pad(p.roomNo)}`;
    // 모집 글 작성자는 그 방의 첫 멤버(방장)로 맞춘다.
    const ownerId = data.memberships.find((m) => m.room_id === roomId)?.user_id ?? data.users[0].id;
    posts.push({
      id: `${DEMO_ID_PREFIX}rest-recruit-${pad(i + 1)}`,
      user_id: ownerId,
      title: p.title,
      content: p.content,
      created_at: new Date(now - (3 + i * 14) * hour).toISOString(),
      category: "인원 모집",
      room_id: roomId,
      info_category: null,
      pinned: false,
    });
  });

  return posts;
}
