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
}
