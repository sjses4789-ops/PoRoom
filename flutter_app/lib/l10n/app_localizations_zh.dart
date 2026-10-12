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

  @override
  String get back => '返回';

  @override
  String get cancel => '取消';

  @override
  String get close => '关闭';

  @override
  String get confirm => '确定';

  @override
  String get delete => '删除';

  @override
  String get roomTabMembers => '成员';

  @override
  String get roomTabChat => '聊天';

  @override
  String get roomTabRecord => '记录';

  @override
  String get roomMenuWeb => '日程·投票·公告栏·记录（网页）';

  @override
  String get roomLeave => '离开房间';

  @override
  String get roomLeaveConfirmBody => '要离开这个房间吗？';

  @override
  String get roomNotFound => '找不到房间';

  @override
  String get roomNotJoined => '您还没有加入这个房间。';

  @override
  String get roomInviteOnly => '这个房间需要邀请码才能加入。';

  @override
  String get roomEnter => '加入';

  @override
  String participantsLine(int count, int online) {
    return '成员 $count人 · 在线 $online人';
  }

  @override
  String participantsLineCap(int count, int capacity, int online) {
    return '成员 $count/$capacity人 · 在线 $online人';
  }

  @override
  String get phaseFocus => '专注';

  @override
  String get phaseBreak => '休息';

  @override
  String get phaseIdle => '待机';

  @override
  String lastSeen(String label) {
    return '$label在线';
  }

  @override
  String get neverSeen => '无在线记录';

  @override
  String get justNow => '刚刚';

  @override
  String minutesAgo(int count) {
    return '$count分钟前';
  }

  @override
  String hoursAgo(int count) {
    return '$count小时前';
  }

  @override
  String daysAgo(int count) {
    return '$count天前';
  }

  @override
  String get charUnit => '字';

  @override
  String get cutUnit => '格';

  @override
  String get recordsPrivate => '不公开';

  @override
  String get pomodoroStart => '开始';

  @override
  String get pomodoroPause => '暂停';

  @override
  String get pomodoroResume => '继续';

  @override
  String get pomodoroReset => '重置';

  @override
  String get pomodoroFocusLabel => '专注';

  @override
  String get pomodoroBreakLabel => '休息';

  @override
  String get minuteUnit => '分钟';

  @override
  String pomodoroSessions(int count) {
    return '第$count轮';
  }

  @override
  String get chatEmpty => '还没有消息。打个招呼吧 👋';

  @override
  String get chatInputHint => '输入消息';

  @override
  String get chatSend => '发送';

  @override
  String get chatDeleteTitle => '删除消息';

  @override
  String get chatDeleteBody => '要删除这条消息吗？';

  @override
  String get whisperTag => '悄悄话';

  @override
  String get selfLabel => '我';

  @override
  String get unknownUser => '未知';

  @override
  String recordToday(int count, String unit) {
    return '今天 $count$unit';
  }

  @override
  String get recordAdd => '添加';

  @override
  String get recordInputHint => '要添加的字数（格数）';

  @override
  String get recordAdded => '已记录';

  @override
  String get recordFailed => '记录失败。';

  @override
  String get sessionTakenOver => '您在另一个浏览器或设备上继续使用了此房间，因此此屏幕的番茄钟已停止。';

  @override
  String get sessionGuardDuplicateTitle => '您已在其他地方连接';

  @override
  String get sessionGuardDuplicateBody =>
      '同一账号已在另一个浏览器或设备上进入此房间。同时使用两处可能会让番茄钟时间和字数记录重复累计。';

  @override
  String get sessionGuardContinueHere => '在此屏幕继续使用';

  @override
  String get sessionGuardContinueHint => '另一处的连接将结束，那边的番茄钟会停止。';

  @override
  String get sessionGuardLeave => '返回PoRoom';

  @override
  String get sessionGuardTakenOverTitle => '您已在其他地方继续使用此房间';

  @override
  String get sessionGuardTakenOverBody =>
      '同一账号在另一个浏览器或设备上进入此房间并接管了使用。为避免记录重叠，此屏幕的番茄钟已停止。';

  @override
  String get sessionGuardOk => '前往PoRoom';

  @override
  String get feedCatAll => '全部';

  @override
  String get feedCatWrite => '创作';

  @override
  String get feedCatDuel => '对决';

  @override
  String get feedCatChallenge => '挑战';

  @override
  String get feedCatSubmission => '投稿';

  @override
  String get feedCatContest => '比赛';

  @override
  String get feedMoodHint => '分享今天的心情或近况';

  @override
  String get feedPost => '发布';

  @override
  String get feedPostFailed => '发布失败。';

  @override
  String get feedEmpty => '还没有帖子。';

  @override
  String get feedWriteOnWebHint => '该分类的帖子请在网页上发布。';

  @override
  String get feedDeleteConfirm => '要删除这条帖子吗？';

  @override
  String feedMinutesFocus(int count) {
    return '专注$count分钟';
  }

  @override
  String get feedWin => '胜';

  @override
  String get feedLoss => '负';

  @override
  String get feedDraw => '平';

  @override
  String get feedAchieved => '已达成';

  @override
  String get feedNotAchieved => '未达成';

  @override
  String get rankTabChars => '字数';

  @override
  String get rankTabChallenge => '挑战';

  @override
  String get rankTabTyping => '打字';

  @override
  String get rankScopeUser => '个人';

  @override
  String get rankScopeRoom => '房间';

  @override
  String get rankPeriodDay => '日榜';

  @override
  String get rankPeriodMonth => '月榜';

  @override
  String get rankPeriodYear => '年榜';

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
    return '$score分';
  }

  @override
  String rankCpmValue(int cpm) {
    return '$cpm字/分';
  }

  @override
  String rankMyRank(int rank, int total, String value) {
    return '我的排名 第$rank名 / 共$total人 · $value';
  }

  @override
  String get rankEmpty => '暂无统计记录。';

  @override
  String get rankChallengeHint => '1千字1分 · 5千字2分 · 1万字3分 · 初稿5分 · 管理员活动7分';

  @override
  String get positionNovelist => '网络小说';

  @override
  String get positionWebtoon => '网络漫画';

  @override
  String get competeChallenges => '挑战';

  @override
  String get competeDuels => '对决';

  @override
  String get competeEmpty => '暂时没有。';

  @override
  String get competeJoined => '参与中';

  @override
  String get competeOpen => '可参加';

  @override
  String get competeCreateOnWeb => '创建对决或凭邀请码加入请在网页上操作';

  @override
  String get competeJoinedBadge => '参与中';

  @override
  String get competeNotStarted => '未开始';

  @override
  String competeParticipants(int count) {
    return '$count人参加';
  }

  @override
  String get competeEnded => '已结束';

  @override
  String competeProgress(String a, String b) {
    return '今天 $a / $b';
  }

  @override
  String get competeLeave => '退出';

  @override
  String get competeJoin => '参加';

  @override
  String get restTabBoard => '公告栏';

  @override
  String get restTabGames => '游戏';

  @override
  String get restCatInfo => '信息';

  @override
  String get restCatRecruit => '招募';

  @override
  String get restCatFree => '自由';

  @override
  String get restGameTyping => '打字练习';

  @override
  String get restGameMinesweeper => '扫雷';

  @override
  String get restGameTetris => '俄罗斯方块';

  @override
  String get restGameWordChain => '成语接龙';

  @override
  String get restGameChoseong => '首音猜词';

  @override
  String get restGamesHint => '游戏请在网页上玩。';

  @override
  String get notesReply => '回复';

  @override
  String notesReplyTo(String name) {
    return '回复$name';
  }

  @override
  String get notesPlaceholder => '请填写纸条内容';

  @override
  String get notesSend => '发送';

  @override
  String get notesSent => '纸条已发送';

  @override
  String get notesEmpty => '没有收到的纸条。';

  @override
  String get meToday => '今天';

  @override
  String get meMonth => '本月';

  @override
  String get meTodos => '待办';

  @override
  String get meTodoHint => '添加待办';

  @override
  String get meNoTodos => '没有待办事项。';

  @override
  String get meOpenWeb => '统计·目标·作品请在网页查看';

  @override
  String get challengeDaily1k => '每日1000字写作挑战';

  @override
  String get challengeDaily5k => '每日5000字写作挑战';

  @override
  String get challengeDaily10k => '每日1万字写作挑战';

  @override
  String get challengeMonthlyDraft => '每月初稿完成挑战';

  @override
  String get guestLoginButton => '登录';

  @override
  String get loginRequiredTitle => '需要登录';

  @override
  String get loginRequiredBody => '未登录时只能浏览。发帖、点赞、加入房间等功能需要先登录。';

  @override
  String get guestViewerBanner => '仅供浏览 · 登录后可使用全部功能';
}
