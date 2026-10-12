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
}
