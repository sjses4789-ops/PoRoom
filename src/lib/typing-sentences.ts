// 타자 연습용 예시 문장 — 집필/글쓰기 서비스 성격에 맞게 짧은 문장
// 위주로 골랐다. 영어 화면일 때만 영어 문장 풀을 쓰고(일본어/중국어는
// 자체 예문 없이 한국어 문장을 그대로 쓴다), 그 외엔 한국어 문장 풀을
// 쓴다.
const KO_SENTENCES: string[] = [
  "오늘도 한 문장씩 꾸준히 써 내려갑니다.",
  "좋은 글은 한 번에 완성되지 않습니다.",
  "책상 앞에 앉아 첫 문장을 다시 고쳐 씁니다.",
  "커서가 깜빡이는 빈 화면을 마주합니다.",
  "이야기의 다음 장면이 조금씩 떠오릅니다.",
  "주인공의 마음을 더 깊이 들여다봅니다.",
  "밤늦게까지 원고를 붙잡고 씨름했습니다.",
  "마감일이 다가오니 손끝이 바빠집니다.",
  "커피 한 잔과 함께 집필을 시작합니다.",
  "오타를 고치며 문장을 다듬어 갑니다.",
  "짧은 휴식을 마치고 다시 자리에 앉습니다.",
  "머릿속 상상을 글자로 옮기는 중입니다.",
  "완결까지 남은 분량을 헤아려 봅니다.",
  "독자에게 전하고 싶은 이야기가 있습니다.",
  "낱말 하나를 고르는 데도 오래 걸립니다.",
  "새벽 공기 속에서 마지막 문단을 씁니다.",
  "어제보다 오늘 조금 더 나아졌습니다.",
  "빈 종이 위에 첫 줄을 그어 봅니다.",
  "꾸준함이 결국 좋은 글을 만듭니다.",
  "쓰고 지우기를 몇 번이고 반복합니다.",
];

const EN_SENTENCES: string[] = [
  "Every good story starts with a single sentence.",
  "She stared at the blinking cursor for a while.",
  "The deadline is closer than it looks today.",
  "A cup of coffee makes the writing easier.",
  "He rewrote the first line one more time.",
  "The next scene is slowly taking shape.",
  "Small daily habits build a finished draft.",
  "Editing is where the real writing happens.",
  "The blank page waits for the first word.",
  "Every writer fixes typos late at night.",
  "A short break helps clear a tired mind.",
  "The character finally says what she means.",
  "Progress today is better than none at all.",
  "Readers remember stories, not perfect grammar.",
  "One word at a time, the chapter grows.",
  "The quiet morning is perfect for writing.",
  "Yesterday's draft reads better than expected.",
  "Choosing the right word can take forever.",
  "Consistency matters more than raw talent.",
  "The last paragraph ties the story together.",
];

export function pickRandomSentence(locale: string, exclude?: string): string {
  const pool = locale === "en" ? EN_SENTENCES : KO_SENTENCES;
  const filtered = exclude ? pool.filter((s) => s !== exclude) : pool;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
