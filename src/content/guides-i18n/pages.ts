import type { GuideLang } from "./index";

// 영어·일본어 "서비스 소개"와 "자주 묻는 질문" — 한국어 페이지(/about, /faq)와 같은 내용을 옮긴 것이다.
export type AboutText = {
  title: string;
  description: string;
  intro: string;
  whyTitle: string;
  why: string[];
  forWhoTitle: string;
  forWho: string[];
  featuresTitle: string;
  features: { title: string; body: string }[];
  howTitle: string;
  how: string[];
  moreLead: string;
  moreFaq: string;
  moreAnd: string;
  moreGuide: string;
  contactTitle: string;
  contactBodyBefore: string;
  contactBodyAfter: string;
  privacyLead: string;
  privacyLink: string;
  enter: string;
  readGuide: string;
};

export type FaqText = {
  title: string;
  description: string;
  lead: string;
  leadAbout: string;
  leadOr: string;
  leadAfter: string;
  items: { q: string; a: string }[];
};

export const ABOUT: Record<GuideLang, AboutText> = {
  en: {
    title: "About PoRoom",
    description:
      "PoRoom is an online Pomodoro studio for web novel and webtoon creators. Focus together in the same room without a camera, and build a steady writing habit with word-count tracking, rankings, duels and challenges.",
    intro:
      "PoRoom is an online Pomodoro studio for web novelists and webtoon artists. A serial is a long-distance run that lasts months or years, and because most creators work alone, both starting and keeping going can be hard. PoRoom tries to ease that by letting you spend your working time together in the same room.",
    whyTitle: "Why we built it",
    why: [
      "You may have noticed that you somehow focus better in a library or a study cafe. The way that simply having someone nearby makes it easier to start is sometimes called body doubling. But for creators who work alone at home it is hard to recreate that environment every time, and video meetups mean showing your face or your work screen.",
      "That is why PoRoom works with just a nickname, with no camera and no microphone. The goal is to give you a feeling of not being alone just by letting you see the focus and break status of the people in your room.",
    ],
    forWhoTitle: "Who it's for",
    forWho: [
      "Writers who are serializing or drafting a web novel",
      "Artists who are serializing or working on a webtoon",
      "People whose next-episode deadline is always tight",
      "People who struggle to focus alone and keep putting things off",
      "People who feel lonely working alone but find group meetups a burden",
    ],
    featuresTitle: "Main features",
    features: [
      {
        title: "An online writing studio",
        body: "When you enter a room you see cards for the other creators working at the same time, along with their live Pomodoro progress. You get the feeling of working side by side without a video call.",
      },
      {
        title: "A synced Pomodoro timer",
        body: "Set your own focus and break times and run the timer, and the people in your room can see your status. Your focus time is recorded automatically.",
      },
      {
        title: "Character and cut tracking",
        body: "Web novelists record their character count and webtoon artists record the cuts they worked on. Your daily records build up into graphs you can review.",
      },
      {
        title: "Chat and whispers",
        body: "Chat freely in the room, or send a whisper to a single participant when you need to. Room owners and vice-owners can manage the room.",
      },
      {
        title: "Rankings, duels and challenges",
        body: "Check character-count and focus-time rankings, compete over a set period in a duel with another creator, or join recurring challenges such as writing 5,000 or 10,000 characters a day.",
      },
      {
        title: "Calendar, polls and boards",
        body: "Each room has a calendar for sharing deadlines, polls for gathering opinions and a board for notices and tips. The whole service also has free, info and recruitment boards.",
      },
    ],
    howTitle: "How to use it",
    how: [
      "Sign in with your Google account and choose a nickname and your role (web novelist or webtoon artist).",
      "On the PoRoom page, join a room you like or create a new one. You can also create a private room if you want to write alone.",
      "Start the timer and focus, then record today's character count (cuts for webtoon artists) when you finish.",
      "Post today's work to the Feed, or join duels and challenges on the Compete page.",
    ],
    moreLead: "You can find more detailed instructions in the ",
    moreFaq: "FAQ",
    moreAnd: " and the ",
    moreGuide: "Writer's Guide",
    contactTitle: "Operation and contact",
    contactBodyBefore:
      "PoRoom is operated by GGOZIL and is a beta service that is still being developed and improved. Some features may change and there may be maintenance without notice. Please send questions and suggestions to ",
    contactBodyAfter: ". ",
    privacyLead: "You can read about how personal information is handled in the ",
    privacyLink: "Privacy Policy",
    enter: "Enter PoRoom",
    readGuide: "Read the Writer's Guide",
  },
  ja: {
    title: "サービス紹介",
    description:
      "ポルーム(PoRoom)は、Web小説・ウェブトゥーン作家のためのオンライン・ポモドーロ作業室です。カメラなしで同じルームに集まって集中し、文字数記録、ランキング、対決、チャレンジで書き続ける習慣を作れます。",
    intro:
      "ポルーム(PoRoom)は、Web小説作家とウェブトゥーン作家のためのオンライン・ポモドーロ作業室です。連載は数か月、数年と続く長距離走で、ほとんどの作家は一人で働くため、始めることも続けることも簡単ではありません。ポルームは、同じルームで一緒に時間を過ごす仕組みで、その難しさを少しでも軽くしようとするサービスです。",
    whyTitle: "なぜ作ったのか",
    why: [
      "図書館や自習カフェでは、なぜか集中できるという経験があるのではないでしょうか。そばに誰かがいるだけで始めやすくなるこの現象を「ボディダブリング」と呼ぶこともあります。しかし、自宅で一人で働く作家がこうした環境を毎回作るのは難しく、ビデオ通話の集まりでは顔や作業画面を見せなければならない負担があります。",
      "そこでポルームは、カメラもマイクも使わず、ニックネームだけで参加できるようにしました。同じルームにいる人たちの集中・休憩の状態が見えるだけで「一人じゃない」という感覚を届けることが目標です。",
    ],
    forWhoTitle: "こんな方に向いています",
    forWho: [
      "Web小説を連載中、または執筆中の作家",
      "ウェブトゥーンを連載中、または制作中の作家",
      "次回の締め切りがいつもぎりぎりの方",
      "一人だと集中しづらく、つい先延ばしにしてしまう方",
      "一人は寂しいけれど、集まりに参加するのは負担に感じる方",
    ],
    featuresTitle: "主な機能",
    features: [
      {
        title: "オンライン執筆作業室",
        body: "ルームに入ると、同じ時間に作業している他の作家のカードとポモドーロの進行状況がリアルタイムで見えます。ビデオ通話なしでも「隣で一緒に働いている」感覚が得られます。",
      },
      {
        title: "同期するポモドーロタイマー",
        body: "集中と休憩の時間を自分で決めてタイマーを回すと、同じルームの人にあなたの状態が見えます。集中時間は自動的に記録されます。",
      },
      {
        title: "文字数・カット数の記録",
        body: "Web小説作家は文字数を、ウェブトゥーン作家は作業したカット数を記録します。日ごとにたまった記録はグラフで確認できます。",
      },
      {
        title: "チャットとささやき",
        body: "ルームの中で気軽に会話でき、必要なら特定の参加者だけにささやきを送れます。ルーム主と副ルーム主はルームを管理できます。",
      },
      {
        title: "ランキング・対決・チャレンジ",
        body: "文字数・集中時間のランキングを見たり、ほかの作家と期間を決めて競う対決、毎日5千字・1万字といった繰り返しのチャレンジに参加したりできます。",
      },
      {
        title: "カレンダー・投票・掲示板",
        body: "ルームごとに、締め切りを共有するカレンダー、意見を集める投票、お知らせや情報共有の掲示板があります。サービス全体には自由・情報・メンバー募集の掲示板もあります。",
      },
    ],
    howTitle: "使い方",
    how: [
      "Googleアカウントでログインし、ニックネームと職業(Web小説作家またはウェブトゥーン作家)を決めます。",
      "[ポルーム]で気に入ったルームに入室するか、新しいルームを作ります。一人で書きたい場合は非公開ルームも作れます。",
      "タイマーを開始して集中し、終わったら今日の文字数(ウェブトゥーンはカット数)を記録します。",
      "[フィード]に今日の作業を残したり、[挑戦]で対決やチャレンジに参加してみましょう。",
    ],
    moreLead: "より詳しい使い方は、",
    moreFaq: "よくある質問",
    moreAnd: "と",
    moreGuide: "作家ガイド",
    contactTitle: "運営とお問い合わせ",
    contactBodyBefore:
      "ポルームはGGOZILが運営しており、現在も開発と改善が続くベータサービスです。一部の機能が変わったり、予告なくメンテナンスが行われたりすることがあります。お問い合わせやご提案は、",
    contactBodyAfter: "までお送りください。",
    privacyLead: "個人情報の取り扱いについては、",
    privacyLink: "プライバシーポリシー",
    enter: "ポルームに入る",
    readGuide: "作家ガイドを見る",
  },
};

export const FAQ: Record<GuideLang, FaqText> = {
  en: {
    title: "FAQ",
    description:
      "Answers to common questions about PoRoom: pricing, using it alone, private rooms, cameras, sign-in and personal data, and how to block a participant.",
    lead: "If you can't find what you're looking for, see ",
    leadAbout: "About",
    leadOr: " or email ",
    leadAfter: ".",
    items: [
      {
        q: "Is PoRoom free to use?",
        a: "Yes, you can use all features for free.",
      },
      {
        q: "Can I use it alone?",
        a: "Yes. If you create a room and set it to private, you can use it by yourself.",
      },
      {
        q: "I want only people I know to join my room.",
        a: "If you set the room to invite-only when creating it, only people who know the invite code can join.",
      },
      {
        q: "Does PoRoom support video cameras?",
        a: "No. We deliberately left out video so that creators who feel uneasy about showing their face or work screen can use PoRoom comfortably. You take part with just a nickname and a character.",
      },
      {
        q: "Can I share photos?",
        a: "Yes. You can send photos in room chat (the 'Attach photo' menu next to the whisper list, or Ctrl+V). Only room members can see them, and they are deleted automatically after 30 days.",
      },
      {
        q: "What information do you collect when I sign in with Google?",
        a: "We use only the minimum, such as your email and name, to confirm your sign-in. We don't read other information from your Google account such as Google Drive or contacts. You can read the details in the Privacy Policy.",
      },
      {
        q: "There's a participant who makes me uncomfortable.",
        a: "Open the settings button at the top right of the room, go to participant management and press Block next to that person. They are removed immediately and can't re-enter until the room owner unblocks them.",
      },
      {
        q: "How do I record my character count?",
        a: "Web novelists enter their current character count in the room, and the difference from your previous entry is added to today's record. Webtoon artists enter the number of cuts they worked on today. Records feed into rankings and your personal statistics.",
      },
      {
        q: "How are rankings decided?",
        a: "They are tallied separately by character count (cuts for webtoons), focus time, duel results, challenge successes and typing speed. Web novelists and webtoon artists use different units, so they are shown separately.",
      },
      {
        q: "Can I use it on mobile?",
        a: "Yes, you can use it in a mobile web browser. A dedicated app has not been officially released yet.",
      },
    ],
  },
  ja: {
    title: "よくある質問",
    description:
      "ポルーム(PoRoom)の利用料金、一人での利用、非公開ルーム、カメラ、ログインと個人情報、迷惑な参加者のブロック方法など、よくある質問にお答えします。",
    lead: "お探しの内容がない場合は、",
    leadAbout: "サービス紹介",
    leadOr: "をご覧いただくか、",
    leadAfter: "までお問い合わせください。",
    items: [
      {
        q: "ポルーム(PoRoom)は無料で使えますか?",
        a: "はい、すべての機能を無料でご利用いただけます。",
      },
      {
        q: "一人でも使えますか?",
        a: "はい。ルーム作成で非公開ルームに設定してルームを作れば、一人でも利用できます。",
      },
      {
        q: "知り合いだけにルームに入ってほしいです。",
        a: "ルーム作成で招待専用に設定すると、招待コードを知っている知り合いだけが入室できます。",
      },
      {
        q: "ビデオカメラには対応していますか?",
        a: "いいえ。ポルームは、顔や作業画面を見せることに負担を感じる作家も気軽に使えるよう、ビデオカメラ機能をあえて入れていません。ニックネームとキャラクターだけで参加します。",
      },
      {
        q: "写真の共有はできますか?",
        a: "はい、ルームのチャットで写真を送れます(ささやきボタンの「写真を添付」またはCtrl+V)。写真はルームの参加者だけが見られ、30日後に自動的に削除されます。",
      },
      {
        q: "Googleアカウントでログインすると、どんな情報を収集しますか?",
        a: "ログインの確認のために、メールアドレスや名前など最小限の情報だけを使い、Googleドライブや連絡先などGoogleアカウントのほかの情報は取得しません。詳しくはプライバシーポリシーをご覧ください。",
      },
      {
        q: "迷惑な参加者がいます。",
        a: "ルーム右上の設定ボタンから参加者管理に入り、その参加者の「ブロック」ボタンを押すと、すぐにルームから退出させられ、ルーム主がブロックを解除するまで再入室できません。",
      },
      {
        q: "文字数はどのように記録しますか?",
        a: "Web小説作家は、ルームで現在の文字数を入力すると、前回の記録との差が今日の記録に加算されます。ウェブトゥーン作家は、今日作業したカット数を直接入力します。記録はランキングと個人統計に反映されます。",
      },
      {
        q: "ランキングはどんな基準で決まりますか?",
        a: "文字数(ウェブトゥーンはカット数)、集中時間、対決の成績、チャレンジの成功、タイピング速度の基準で、それぞれ別に集計されます。Web小説作家とウェブトゥーン作家は単位が違うため、分けて表示されます。",
      },
      {
        q: "モバイルでも使えますか?",
        a: "はい、モバイルのウェブブラウザでも利用できます。専用アプリはまだ正式リリース前です。",
      },
    ],
  },
};
