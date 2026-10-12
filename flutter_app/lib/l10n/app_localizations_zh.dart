// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class L10nZh extends L10n {
  L10nZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => 'PoRoom';

  @override
  String get tabFeed => '动态';

  @override
  String get tabCompete => '挑战';

  @override
  String get tabHome => 'PoRoom';

  @override
  String get tabRanking => '排行';

  @override
  String get tabRest => '休息';

  @override
  String get myPage => '我的';

  @override
  String get mailbox => '信箱';

  @override
  String get loginSubtitle => '无需视频会议，一起专注的\n在线番茄钟工作室';

  @override
  String get loginGoogle => '使用 Google 登录';

  @override
  String get loginNote => '可与网页(poroom.kr)使用同一账号。';

  @override
  String get loginFailed => '登录失败，请重试。';

  @override
  String get profileIncompleteTitle => '请先设置昵称和职业';

  @override
  String get profileIncompleteBody => '如果您刚注册，请先在网页上设置昵称和职业，然后重新打开应用。';

  @override
  String get profileIncompleteButton => '前往网页设置';

  @override
  String get retry => '重试';

  @override
  String get loading => '加载中...';

  @override
  String get loadFailed => '加载失败。';

  @override
  String get signOut => '退出登录';

  @override
  String get myRooms => '我的房间';

  @override
  String get openRooms => '公开房间';

  @override
  String get noMyRooms => '您还没有加入任何房间。试试下面的公开房间吧。';

  @override
  String get noOpenRooms => '目前没有可加入的公开房间。';

  @override
  String memberCount(int count) {
    return '$count人';
  }

  @override
  String get joinRoom => '加入';

  @override
  String get joinFailed => '加入房间失败。';

  @override
  String get systemRoomLabel => '系统房间';

  @override
  String get comingSoon => '敬请期待';

  @override
  String get comingSoonBody => '此页面即将上线。目前请先使用网页(poroom.kr)。';

  @override
  String get openOnWeb => '在网页中打开';
}
