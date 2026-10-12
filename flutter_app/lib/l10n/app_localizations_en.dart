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
}
