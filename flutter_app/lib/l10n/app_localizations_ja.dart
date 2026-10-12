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
}
