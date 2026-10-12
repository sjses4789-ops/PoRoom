// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class L10nJa extends L10n {
  L10nJa([String locale = 'ja']) : super(locale);

  @override
  String get appTitle => 'PoRoom';

  @override
  String get tabFeed => 'フィード';

  @override
  String get tabCompete => '挑戦';

  @override
  String get tabHome => 'ポルーム';

  @override
  String get tabRanking => 'ランキング';

  @override
  String get tabRest => '休憩';

  @override
  String get myPage => 'マイ';

  @override
  String get mailbox => 'メールボックス';

  @override
  String get loginSubtitle => 'ビデオ会議なしでいっしょに集中する\nオンラインのポモドーロ作業部屋';

  @override
  String get loginGoogle => 'Googleで始める';

  @override
  String get loginNote => 'ウェブ(poroom.kr)と同じアカウントで続けて使えます。';

  @override
  String get loginFailed => 'ログインできませんでした。もう一度お試しください。';

  @override
  String get profileIncompleteTitle => '先にニックネームと職業を決めてください';

  @override
  String get profileIncompleteBody =>
      '新規登録した場合は、ウェブでニックネームと職業を設定してからアプリを開き直してください。';

  @override
  String get profileIncompleteButton => 'ウェブで設定する';

  @override
  String get retry => '再試行';

  @override
  String get loading => '読み込み中...';

  @override
  String get loadFailed => '読み込めませんでした。';

  @override
  String get signOut => 'ログアウト';

  @override
  String get myRooms => 'マイルーム';

  @override
  String get openRooms => '公開ルーム';

  @override
  String get noMyRooms => '参加中のルームがありません。下の公開ルームに入ってみましょう。';

  @override
  String get noOpenRooms => '今入れる公開ルームはありません。';

  @override
  String memberCount(int count) {
    return '$count人';
  }

  @override
  String get joinRoom => '入室';

  @override
  String get joinFailed => '入室できませんでした。';

  @override
  String get systemRoomLabel => 'システムルーム';

  @override
  String get comingSoon => '準備中です';

  @override
  String get comingSoonBody => 'この画面はまもなくアプリに追加されます。今はウェブ(poroom.kr)をご利用ください。';

  @override
  String get openOnWeb => 'ウェブで開く';

  @override
  String get back => '戻る';

  @override
  String get cancel => 'キャンセル';

  @override
  String get close => '閉じる';

  @override
  String get confirm => 'OK';

  @override
  String get delete => '削除';

  @override
  String get roomTabMembers => '参加者';

  @override
  String get roomTabChat => 'チャット';

  @override
  String get roomTabRecord => '記録';

  @override
  String get roomMenuWeb => '予定・投票・掲示板・記録（ウェブ）';

  @override
  String get roomLeave => 'ルームを出る';

  @override
  String get roomLeaveConfirmBody => 'このルームを出ますか？';

  @override
  String get roomNotFound => 'ルームが見つかりません';

  @override
  String get roomNotJoined => 'まだこのルームに入室していません。';

  @override
  String get roomInviteOnly => '招待コードで入室できるルームです。';

  @override
  String get roomEnter => '入室する';

  @override
  String participantsLine(int count, int online) {
    return '参加者 $count人 · オンライン $online人';
  }

  @override
  String participantsLineCap(int count, int capacity, int online) {
    return '参加者 $count/$capacity人 · オンライン $online人';
  }

  @override
  String get phaseFocus => '集中';

  @override
  String get phaseBreak => '休憩';

  @override
  String get phaseIdle => '待機';

  @override
  String lastSeen(String label) {
    return '$labelにオンライン';
  }

  @override
  String get neverSeen => '接続履歴なし';

  @override
  String get justNow => 'たった今';

  @override
  String minutesAgo(int count) {
    return '$count分前';
  }

  @override
  String hoursAgo(int count) {
    return '$count時間前';
  }

  @override
  String daysAgo(int count) {
    return '$count日前';
  }

  @override
  String get charUnit => '字';

  @override
  String get cutUnit => 'コマ';

  @override
  String get recordsPrivate => '非公開';

  @override
  String get pomodoroStart => '開始';

  @override
  String get pomodoroPause => '一時停止';

  @override
  String get pomodoroResume => '再開';

  @override
  String get pomodoroReset => 'リセット';

  @override
  String get pomodoroFocusLabel => '集中';

  @override
  String get pomodoroBreakLabel => '休憩';

  @override
  String get minuteUnit => '分';

  @override
  String pomodoroSessions(int count) {
    return '$count回目';
  }

  @override
  String get chatEmpty => 'まだ会話がありません。最初のあいさつをどうぞ 👋';

  @override
  String get chatInputHint => 'メッセージを入力';

  @override
  String get chatSend => '送信';

  @override
  String get chatDeleteTitle => 'メッセージを削除';

  @override
  String get chatDeleteBody => 'このメッセージを削除しますか？';

  @override
  String get whisperTag => 'ささやき';

  @override
  String get selfLabel => '自分';

  @override
  String get unknownUser => '不明';

  @override
  String recordToday(int count, String unit) {
    return '今日 $count$unit';
  }

  @override
  String get recordAdd => '追加';

  @override
  String get recordInputHint => '追加する文字数（コマ数）';

  @override
  String get recordAdded => '記録しました';

  @override
  String get recordFailed => '記録できませんでした。';

  @override
  String get sessionTakenOver =>
      '別のブラウザまたは端末でこのルームの続きを使い始めたため、この画面のポモドーロを停止しました。';

  @override
  String get sessionGuardDuplicateTitle => 'すでに別の場所で接続中です';

  @override
  String get sessionGuardDuplicateBody =>
      '同じアカウントが別のブラウザまたは端末からこのルームに接続しています。両方で同時に使うと、ポモドーロ時間や文字数の記録が重複して加算されることがあります。';

  @override
  String get sessionGuardContinueHere => 'この画面で続ける';

  @override
  String get sessionGuardContinueHint => 'もう一方の接続は終了し、そちらのポモドーロは停止します。';

  @override
  String get sessionGuardLeave => 'PoRoomに戻る';

  @override
  String get sessionGuardTakenOverTitle => '別の場所でこのルームを続けています';

  @override
  String get sessionGuardTakenOverBody =>
      '同じアカウントが別のブラウザまたは端末でこのルームに接続し、続きを使い始めました。記録が重複しないよう、この画面のポモドーロは停止しました。';

  @override
  String get sessionGuardOk => 'PoRoomへ移動';

  @override
  String get feedCatAll => 'すべて';

  @override
  String get feedCatWrite => '作業';

  @override
  String get feedCatDuel => '対決';

  @override
  String get feedCatChallenge => 'チャレンジ';

  @override
  String get feedCatSubmission => '投稿';

  @override
  String get feedCatContest => '公募展';

  @override
  String get feedMoodHint => '今日の気分やお知らせを残しましょう';

  @override
  String get feedPost => '投稿';

  @override
  String get feedPostFailed => '投稿できませんでした。';

  @override
  String get feedEmpty => 'まだ投稿がありません。';

  @override
  String get feedWriteOnWebHint => 'この分類の投稿はウェブで書けます。';

  @override
  String get feedDeleteConfirm => 'この投稿を削除しますか？';

  @override
  String feedMinutesFocus(int count) {
    return '$count分集中';
  }

  @override
  String get feedWin => '勝';

  @override
  String get feedLoss => '負';

  @override
  String get feedDraw => '分';

  @override
  String get feedAchieved => '達成';

  @override
  String get feedNotAchieved => '未達成';

  @override
  String get rankTabChars => '文字数';

  @override
  String get rankTabChallenge => 'チャレンジ';

  @override
  String get rankTabTyping => 'タイピング';

  @override
  String get rankScopeUser => '個人';

  @override
  String get rankScopeRoom => 'ルーム';

  @override
  String get rankPeriodDay => '日別';

  @override
  String get rankPeriodMonth => '月別';

  @override
  String get rankPeriodYear => '年別';

  @override
  String rankDateDay(int month, int day) {
    return '$month月$day日';
  }

  @override
  String rankDateMonth(int year, int month) {
    return '$year年$month月';
  }

  @override
  String rankDateYear(int year) {
    return '$year年';
  }

  @override
  String rankScoreValue(String score) {
    return '$score点';
  }

  @override
  String rankCpmValue(int cpm) {
    return '$cpm打/分';
  }

  @override
  String rankMyRank(int rank, int total, String value) {
    return '自分の順位 $rank位 / $total人 · $value';
  }

  @override
  String get rankEmpty => '集計された記録がありません。';

  @override
  String get rankChallengeHint => '1千字1点 · 5千字2点 · 1万字3点 · 初稿5点 · 管理者イベント7点';

  @override
  String get positionNovelist => 'ウェブ小説';

  @override
  String get positionWebtoon => 'ウェブトゥーン';

  @override
  String get competeChallenges => 'チャレンジ';

  @override
  String get competeDuels => '対決';

  @override
  String get competeEmpty => 'まだありません。';

  @override
  String get competeJoined => '参加中';

  @override
  String get competeOpen => '参加できます';

  @override
  String get competeCreateOnWeb => '対決の作成・招待コードでの参加はウェブで';

  @override
  String get competeJoinedBadge => '参加中';

  @override
  String get competeNotStarted => '開始前';

  @override
  String competeParticipants(int count) {
    return '$count人参加';
  }

  @override
  String get competeEnded => '終了';

  @override
  String competeProgress(String a, String b) {
    return '今日 $a / $b';
  }

  @override
  String get competeLeave => 'やめる';

  @override
  String get competeJoin => '参加する';

  @override
  String get restTabBoard => '掲示板';

  @override
  String get restTabGames => 'ゲーム';

  @override
  String get restCatInfo => '情報';

  @override
  String get restCatRecruit => 'メンバー募集';

  @override
  String get restCatFree => '自由';

  @override
  String get restGameTyping => 'タイピング練習';

  @override
  String get restGameMinesweeper => 'マインスイーパー';

  @override
  String get restGameTetris => 'テトリス';

  @override
  String get restGameWordChain => 'しりとり';

  @override
  String get restGameChoseong => '初声クイズ';

  @override
  String get restGamesHint => 'ゲームはウェブで楽しめます。';

  @override
  String get notesReply => '返信';

  @override
  String notesReplyTo(String name) {
    return '$nameさんに返信';
  }

  @override
  String get notesPlaceholder => 'メモの内容を入力してください';

  @override
  String get notesSend => '送信';

  @override
  String get notesSent => 'メモを送りました';

  @override
  String get notesEmpty => '受信したメモはありません。';

  @override
  String get meToday => '今日';

  @override
  String get meMonth => '今月';

  @override
  String get meTodos => 'やること';

  @override
  String get meTodoHint => 'やることを追加';

  @override
  String get meNoTodos => 'やることはありません。';

  @override
  String get meOpenWeb => '統計・目標・作品はウェブで';

  @override
  String get challengeDaily1k => '毎日1千文字執筆チャレンジ';

  @override
  String get challengeDaily5k => '毎日5千文字執筆チャレンジ';

  @override
  String get challengeDaily10k => '毎日1万文字執筆チャレンジ';

  @override
  String get challengeMonthlyDraft => '毎月初稿完成チャレンジ';

  @override
  String get guestLoginButton => 'ログイン';

  @override
  String get loginRequiredTitle => 'ログインが必要です';

  @override
  String get loginRequiredBody =>
      'ログインしないと閲覧のみできます。投稿・リアクション・ルームへの入室などはログイン後に使えます。';

  @override
  String get guestViewerBanner => '閲覧専用 · ログインするとすべての機能が使えます';
}
