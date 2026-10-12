// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Korean (`ko`).
class L10nKo extends L10n {
  L10nKo([String locale = 'ko']) : super(locale);

  @override
  String get appTitle => 'PoRoom';

  @override
  String get tabFeed => '피드';

  @override
  String get tabCompete => '도전';

  @override
  String get tabHome => '포룸';

  @override
  String get tabRanking => '랭킹';

  @override
  String get tabRest => '휴식';

  @override
  String get myPage => '개인';

  @override
  String get mailbox => '우편함';

  @override
  String get loginSubtitle => '화상회의 없이 함께 집중하는\n온라인 뽀모도로 작업실';

  @override
  String get loginGoogle => 'Google로 시작하기';

  @override
  String get loginNote => '웹(poroom.kr)과 같은 계정으로 이어서 사용할 수 있어요.';

  @override
  String get loginFailed => '로그인하지 못했어요. 다시 시도해 주세요.';

  @override
  String get profileIncompleteTitle => '닉네임과 직업을 먼저 정해 주세요';

  @override
  String get profileIncompleteBody =>
      '처음 가입하셨다면 웹에서 닉네임과 직업을 설정한 뒤 앱을 다시 열어 주세요.';

  @override
  String get profileIncompleteButton => '웹에서 설정하기';

  @override
  String get retry => '다시 시도';

  @override
  String get loading => '불러오는 중...';

  @override
  String get loadFailed => '불러오지 못했어요.';

  @override
  String get signOut => '로그아웃';

  @override
  String get myRooms => '내 방';

  @override
  String get openRooms => '열린 방';

  @override
  String get noMyRooms => '참여 중인 방이 없어요. 아래 열린 방에 들어가 보세요.';

  @override
  String get noOpenRooms => '지금 들어갈 수 있는 열린 방이 없어요.';

  @override
  String memberCount(int count) {
    return '$count명';
  }

  @override
  String get joinRoom => '입장';

  @override
  String get joinFailed => '입장하지 못했어요.';

  @override
  String get systemRoomLabel => '시스템 방';

  @override
  String get comingSoon => '준비 중이에요';

  @override
  String get comingSoonBody => '이 화면은 앱에 곧 들어와요. 지금은 웹(poroom.kr)에서 이용해 주세요.';

  @override
  String get openOnWeb => '웹에서 열기';
}
