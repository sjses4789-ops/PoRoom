import { GUIDES } from "../guides";
import type { GuideCategory } from "../guides/types";
import type { LocalizedGuide, LocalizedGuideMap } from "./types";
import { EN_A } from "./en-a";
import { JA_A } from "./ja-a";

export type GuideLang = "en" | "ja";
export const GUIDE_LANGS: GuideLang[] = ["en", "ja"];

export function isGuideLang(value: string): value is GuideLang {
  return value === "en" || value === "ja";
}

const MAPS: Record<GuideLang, LocalizedGuideMap> = {
  en: { ...EN_A },
  ja: { ...JA_A },
};

// 번역이 있는 글만, 원본(한국어) 순서대로 돌려준다.
export function getLocalizedGuides(lang: GuideLang): LocalizedGuide[] {
  return GUIDES.map((g) => MAPS[lang][g.slug]).filter((g): g is LocalizedGuide => Boolean(g));
}

export function getLocalizedGuide(lang: GuideLang, slug: string): LocalizedGuide | undefined {
  return MAPS[lang][slug];
}

// 이 글이 해당 언어로도 번역돼 있는지(한국어 글의 hreflang 연결에 쓴다).
export function translatedLangs(slug: string): GuideLang[] {
  return GUIDE_LANGS.filter((l) => Boolean(MAPS[l][slug]));
}

export function guideReadMinutesLocalized(lang: GuideLang, guide: LocalizedGuide): number {
  const text = guide.sections
    .flatMap((s) => [
      s.heading,
      ...(s.paragraphs ?? []),
      ...(s.bullets ?? []),
      ...(s.steps ?? []),
      ...(s.example ? [s.example.title, ...s.example.lines] : []),
    ])
    .join(" ");
  // 영어는 분당 약 220단어, 일본어는 분당 약 500자로 본다.
  const minutes = lang === "en" ? text.split(/\s+/).filter(Boolean).length / 220 : text.length / 500;
  return Math.max(1, Math.round(minutes));
}

export const CATEGORY_TEXT: Record<GuideLang, Record<GuideCategory, { name: string; description: string }>> = {
  en: {
    "집필 습관": {
      name: "Writing Habits",
      description: "Pomodoro, routines, slumps, drafts and revision, tracking and planning — how to keep writing steadily",
    },
    "웹소설 작법": {
      name: "Web Novel Craft",
      description: "First episodes, worldbuilding, characters, villains, relationships, dialogue, description, foreshadowing, point of view, genre conventions",
    },
    "웹툰 작업": {
      name: "Webtoon Production",
      description: "Scripts and storyboards, panel direction, coloring, backgrounds, lettering, opening episodes, time budgeting",
    },
    "건강과 환경": {
      name: "Health & Workspace",
      description: "Body care, sleep, meals and energy, mental balance, your work environment",
    },
    "연재와 투고": {
      name: "Serialization & Submission",
      description: "Choosing a platform, pitch emails, contests, contracts and copyright, reader engagement, promotion, income",
    },
  },
  ja: {
    "집필 습관": {
      name: "執筆習慣",
      description: "ポモドーロ、ルーティン、スランプ、初稿と推敲、記録と計画まで、書き続けるための方法",
    },
    "웹소설 작법": {
      name: "Web小説の書き方",
      description: "第1話の構成、世界観、人物、悪役、関係、セリフ、描写、伏線、視点、ジャンルの約束事",
    },
    "웹툰 작업": {
      name: "ウェブトゥーン制作",
      description: "脚本とネーム、コマ演出、着色、背景、写植、序盤の構成、作業時間の配分",
    },
    "건강과 환경": {
      name: "健康と環境",
      description: "体のケア、睡眠、食事とエネルギー、心の管理、作業環境",
    },
    "연재와 투고": {
      name: "連載と投稿",
      description: "連載先の選び方、投稿メール、公募、契約と著作権、読者とのやり取り、宣伝、収入管理",
    },
  },
};

export const GUIDE_UI: Record<
  GuideLang,
  {
    htmlLang: string;
    siteTitle: string;
    nav: { guide: string; about: string; faq: string; privacy: string; enter: string };
    guideTitle: string;
    guideDescription: string;
    guideIntro: string;
    totalLine: (count: number, updated: string) => string;
    readTime: (minutes: number) => string;
    breadcrumb: string;
    summaryTitle: string;
    articleMeta: (category: string, minutes: number, updated: string) => string;
    relatedTitle: string;
    ctaTitle: string;
    ctaBody: string;
    ctaButton: string;
    koreanOnlyNote: string;
    moreKoreanLink: string;
    ogLocale: string;
  }
> = {
  en: {
    htmlLang: "en",
    siteTitle: "PoRoom",
    nav: { guide: "Writer's Guide", about: "About", faq: "FAQ", privacy: "Privacy Policy", enter: "Enter PoRoom" },
    guideTitle: "Writer's Guide",
    guideDescription:
      "Practical guides for web novel and webtoon creators: Pomodoro writing habits, daily routines, beating slumps, body doubling and online co-working, and more.",
    guideIntro:
      "A collection of articles for creators who are publishing or preparing a web novel or webtoon, written so you can try the methods in real work. Each article comes with step-by-step checklists and examples, and you can read just the parts you need.",
    totalLine: (count, updated) => `${count} articles · last updated ${updated}`,
    readTime: (m) => `${m} min read`,
    breadcrumb: "Path",
    summaryTitle: "At a glance",
    articleMeta: (category, m, updated) => `${category} · ${m} min read · updated ${updated}`,
    relatedTitle: "Keep reading",
    ctaTitle: "Try it while focusing together",
    ctaBody:
      "PoRoom is an online studio where web novel and webtoon creators run Pomodoro timers together in the same room, with no camera needed. You can apply the methods in this article right inside a room.",
    ctaButton: "Explore PoRoom",
    koreanOnlyNote: "More guides are available in Korean.",
    moreKoreanLink: "Browse all guides (Korean)",
    ogLocale: "en_US",
  },
  ja: {
    htmlLang: "ja",
    siteTitle: "ポルーム",
    nav: { guide: "作家ガイド", about: "サービス紹介", faq: "よくある質問", privacy: "プライバシーポリシー", enter: "ポルームに入る" },
    guideTitle: "作家ガイド",
    guideDescription:
      "Web小説・ウェブトゥーン作家のための実用ガイド集。ポモドーロの執筆習慣、1日のルーティン、スランプの乗り越え方、ボディダブリングとオンライン作業室の活用などを扱います。",
    guideIntro:
      "Web小説やウェブトゥーンを連載中、または準備中の作家が、実際の作業ですぐ試せるようにまとめた記事集です。各記事には段階的に進められるチェックリストと例が入っており、必要な部分だけ選んで読むこともできます。",
    totalLine: (count, updated) => `全${count}本 · 最終更新 ${updated}`,
    readTime: (m) => `読了目安 約${m}分`,
    breadcrumb: "パンくず",
    summaryTitle: "先に見る",
    articleMeta: (category, m, updated) => `${category} · 読了目安 約${m}分 · 更新 ${updated}`,
    relatedTitle: "続けて読む",
    ctaTitle: "一緒に集中しながら書いてみましょう",
    ctaBody:
      "ポルームは、Web小説・ウェブトゥーン作家がカメラなしで同じルームに集まり、ポモドーロタイマーを一緒に回して作業するオンライン作業室です。この記事の方法をルームですぐに試せます。",
    ctaButton: "ポルームをのぞいてみる",
    koreanOnlyNote: "ほかのガイドは韓国語で読めます。",
    moreKoreanLink: "すべてのガイドを見る(韓国語)",
    ogLocale: "ja_JP",
  },
};
