// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class L10nEn extends L10n {
  L10nEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'PoRoom';

  @override
  String get tabFeed => 'Feed';

  @override
  String get tabCompete => 'Compete';

  @override
  String get tabHome => 'PoRoom';

  @override
  String get tabRanking => 'Ranking';

  @override
  String get tabRest => 'Rest';

  @override
  String get myPage => 'Me';

  @override
  String get mailbox => 'Mailbox';

  @override
  String get loginSubtitle =>
      'An online Pomodoro studio\nto focus together, no video calls';

  @override
  String get loginGoogle => 'Continue with Google';

  @override
  String get loginNote => 'Use the same account as the web (poroom.kr).';

  @override
  String get loginFailed => 'Couldn\'t sign in. Please try again.';

  @override
  String get profileIncompleteTitle => 'Set your nickname and occupation first';

  @override
  String get profileIncompleteBody =>
      'If you just signed up, set your nickname and occupation on the web, then reopen the app.';

  @override
  String get profileIncompleteButton => 'Set up on the web';

  @override
  String get retry => 'Retry';

  @override
  String get loading => 'Loading...';

  @override
  String get loadFailed => 'Couldn\'t load.';

  @override
  String get signOut => 'Log out';

  @override
  String get myRooms => 'My rooms';

  @override
  String get openRooms => 'Open rooms';

  @override
  String get noMyRooms =>
      'You haven\'t joined any rooms. Try an open room below.';

  @override
  String get noOpenRooms => 'No open rooms to join right now.';

  @override
  String memberCount(int count) {
    return '$count people';
  }

  @override
  String get joinRoom => 'Join';

  @override
  String get joinFailed => 'Couldn\'t join the room.';

  @override
  String get systemRoomLabel => 'System room';

  @override
  String get comingSoon => 'Coming soon';

  @override
  String get comingSoonBody =>
      'This screen is coming to the app soon. For now, please use the web (poroom.kr).';

  @override
  String get openOnWeb => 'Open on the web';

  @override
  String get back => 'Back';

  @override
  String get cancel => 'Cancel';

  @override
  String get close => 'Close';

  @override
  String get confirm => 'OK';

  @override
  String get delete => 'Delete';

  @override
  String get roomTabMembers => 'Members';

  @override
  String get roomTabChat => 'Chat';

  @override
  String get roomTabRecord => 'Record';

  @override
  String get roomMenuWeb => 'Events, polls, board & records (web)';

  @override
  String get roomLeave => 'Leave room';

  @override
  String get roomLeaveConfirmBody => 'Leave this room?';

  @override
  String get roomNotFound => 'Room not found';

  @override
  String get roomNotJoined => 'You haven\'t joined this room yet.';

  @override
  String get roomInviteOnly => 'This room is join-by-invite-code only.';

  @override
  String get roomEnter => 'Join';

  @override
  String participantsLine(int count, int online) {
    return '$count members · $online online';
  }

  @override
  String participantsLineCap(int count, int capacity, int online) {
    return '$count/$capacity members · $online online';
  }

  @override
  String get phaseFocus => 'Focus';

  @override
  String get phaseBreak => 'Break';

  @override
  String get phaseIdle => 'Idle';

  @override
  String lastSeen(String label) {
    return 'Seen $label';
  }

  @override
  String get neverSeen => 'Never seen';

  @override
  String get justNow => 'just now';

  @override
  String minutesAgo(int count) {
    return '$count min ago';
  }

  @override
  String hoursAgo(int count) {
    return '$count hr ago';
  }

  @override
  String daysAgo(int count) {
    return '$count d ago';
  }

  @override
  String get charUnit => ' chars';

  @override
  String get cutUnit => ' cuts';

  @override
  String get recordsPrivate => 'Private';

  @override
  String get pomodoroStart => 'Start';

  @override
  String get pomodoroPause => 'Pause';

  @override
  String get pomodoroResume => 'Resume';

  @override
  String get pomodoroReset => 'Reset';

  @override
  String get pomodoroFocusLabel => 'Focus';

  @override
  String get pomodoroBreakLabel => 'Break';

  @override
  String get minuteUnit => ' min';

  @override
  String pomodoroSessions(int count) {
    return 'Round $count';
  }

  @override
  String get chatEmpty => 'No messages yet. Say hi 👋';

  @override
  String get chatInputHint => 'Type a message';

  @override
  String get chatSend => 'Send';

  @override
  String get chatDeleteTitle => 'Delete message';

  @override
  String get chatDeleteBody => 'Delete this message?';

  @override
  String get whisperTag => 'Whisper';

  @override
  String get selfLabel => 'Me';

  @override
  String get unknownUser => 'Unknown';

  @override
  String recordToday(int count, String unit) {
    return 'Today $count$unit';
  }

  @override
  String get recordAdd => 'Add';

  @override
  String get recordInputHint => 'Characters (cuts) to add';

  @override
  String get recordAdded => 'Saved';

  @override
  String get recordFailed => 'Couldn\'t save.';

  @override
  String get sessionTakenOver =>
      'You continued this room in another browser or device, so the Pomodoro on this screen was stopped.';

  @override
  String get sessionGuardDuplicateTitle =>
      'You are already connected elsewhere';

  @override
  String get sessionGuardDuplicateBody =>
      'This account is already in this room from another browser or device. Using both at once can double-count your Pomodoro time and character records.';

  @override
  String get sessionGuardContinueHere => 'Continue on this screen';

  @override
  String get sessionGuardContinueHint =>
      'The other connection will end and its Pomodoro will stop.';

  @override
  String get sessionGuardLeave => 'Back to PoRoom';

  @override
  String get sessionGuardTakenOverTitle =>
      'You continued this room somewhere else';

  @override
  String get sessionGuardTakenOverBody =>
      'This account joined this room from another browser or device and took over. Your Pomodoro on this screen was stopped so records do not overlap.';

  @override
  String get sessionGuardOk => 'Go to PoRoom';

  @override
  String get feedCatAll => 'All';

  @override
  String get feedCatWrite => 'Writing';

  @override
  String get feedCatDuel => 'Duel';

  @override
  String get feedCatChallenge => 'Challenge';

  @override
  String get feedCatSubmission => 'Submission';

  @override
  String get feedCatContest => 'Contest';

  @override
  String get feedMoodHint => 'Share how you feel or your news today';

  @override
  String get feedPost => 'Post';

  @override
  String get feedPostFailed => 'Couldn\'t post.';

  @override
  String get feedEmpty => 'No posts yet.';

  @override
  String get feedWriteOnWebHint =>
      'Posts in this category can be written on the web.';

  @override
  String get feedDeleteConfirm => 'Delete this post?';

  @override
  String feedMinutesFocus(int count) {
    return '$count min focus';
  }

  @override
  String get feedWin => 'Win';

  @override
  String get feedLoss => 'Loss';

  @override
  String get feedDraw => 'Draw';

  @override
  String get feedAchieved => 'Achieved';

  @override
  String get feedNotAchieved => 'Not achieved';

  @override
  String get rankTabChars => 'Characters';

  @override
  String get rankTabChallenge => 'Challenge';

  @override
  String get rankTabTyping => 'Typing';

  @override
  String get rankScopeUser => 'People';

  @override
  String get rankScopeRoom => 'Rooms';

  @override
  String get rankPeriodDay => 'Daily';

  @override
  String get rankPeriodMonth => 'Monthly';

  @override
  String get rankPeriodYear => 'Yearly';

  @override
  String rankDateDay(int month, int day) {
    return '$month/$day';
  }

  @override
  String rankDateMonth(int year, int month) {
    return '$year-$month';
  }

  @override
  String rankDateYear(int year) {
    return '$year';
  }

  @override
  String rankScoreValue(String score) {
    return '$score pts';
  }

  @override
  String rankCpmValue(int cpm) {
    return '$cpm CPM';
  }

  @override
  String rankMyRank(int rank, int total, String value) {
    return 'My rank #$rank of $total · $value';
  }

  @override
  String get rankEmpty => 'No records for this period.';

  @override
  String get rankChallengeHint =>
      'Daily 1k = 1pt · 5k = 2pt · 10k = 3pt · draft finish = 5pt · admin event = 7pt';

  @override
  String get positionNovelist => 'Web novel';

  @override
  String get positionWebtoon => 'Webtoon';

  @override
  String get competeChallenges => 'Challenges';

  @override
  String get competeDuels => 'Duels';

  @override
  String get competeEmpty => 'Nothing here yet.';

  @override
  String get competeJoined => 'Joined';

  @override
  String get competeOpen => 'Open to join';

  @override
  String get competeCreateOnWeb => 'Create a duel or join by code on the web';

  @override
  String get competeJoinedBadge => 'Joined';

  @override
  String get competeNotStarted => 'Not started';

  @override
  String competeParticipants(int count) {
    return '$count joined';
  }

  @override
  String get competeEnded => 'Ended';

  @override
  String competeProgress(String a, String b) {
    return 'Today $a / $b';
  }

  @override
  String get competeLeave => 'Leave';

  @override
  String get competeJoin => 'Join';

  @override
  String get restTabBoard => 'Board';

  @override
  String get restTabGames => 'Games';

  @override
  String get restCatInfo => 'Info';

  @override
  String get restCatRecruit => 'Recruiting';

  @override
  String get restCatFree => 'Free';

  @override
  String get restGameTyping => 'Typing practice';

  @override
  String get restGameMinesweeper => 'Minesweeper';

  @override
  String get restGameTetris => 'Tetris';

  @override
  String get restGameWordChain => 'Word chain';

  @override
  String get restGameChoseong => 'Initial-consonant quiz';

  @override
  String get restGamesHint => 'Games are available on the web.';

  @override
  String get notesReply => 'Reply';

  @override
  String notesReplyTo(String name) {
    return 'Reply to $name';
  }

  @override
  String get notesPlaceholder => 'Write your note';

  @override
  String get notesSend => 'Send';

  @override
  String get notesSent => 'Note sent';

  @override
  String get notesEmpty => 'No notes yet.';

  @override
  String get meToday => 'Today';

  @override
  String get meMonth => 'This month';

  @override
  String get meTodos => 'To-do';

  @override
  String get meTodoHint => 'Add a to-do';

  @override
  String get meNoTodos => 'Nothing to do.';

  @override
  String get meOpenWeb => 'Stats, goals & works on the web';

  @override
  String get challengeDaily1k => 'Daily 1,000 Characters Challenge';

  @override
  String get challengeDaily5k => 'Daily 5,000 Characters Challenge';

  @override
  String get challengeDaily10k => 'Daily 10,000 Characters Challenge';

  @override
  String get challengeMonthlyDraft => 'Monthly First-Draft Challenge';
}
