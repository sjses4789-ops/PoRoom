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

  @override
  String get back => '뒤로';

  @override
  String get cancel => '취소';

  @override
  String get close => '닫기';

  @override
  String get confirm => '확인';

  @override
  String get delete => '삭제';

  @override
  String get roomTabMembers => '참여자';

  @override
  String get roomTabChat => '채팅';

  @override
  String get roomTabRecord => '기록';

  @override
  String get roomMenuWeb => '일정·투표·게시판·기록 (웹)';

  @override
  String get roomLeave => '방 나가기';

  @override
  String get roomLeaveConfirmBody => '이 방에서 나갈까요?';

  @override
  String get roomNotFound => '방을 찾을 수 없어요';

  @override
  String get roomNotJoined => '아직 이 방에 입장하지 않았어요.';

  @override
  String get roomInviteOnly => '초대코드로 입장할 수 있는 방이에요.';

  @override
  String get roomEnter => '입장하기';

  @override
  String participantsLine(int count, int online) {
    return '참여자 $count명 · 접속 중 $online명';
  }

  @override
  String participantsLineCap(int count, int capacity, int online) {
    return '참여자 $count/$capacity명 · 접속 중 $online명';
  }

  @override
  String get phaseFocus => '집중';

  @override
  String get phaseBreak => '휴식';

  @override
  String get phaseIdle => '대기';

  @override
  String lastSeen(String label) {
    return '$label 접속';
  }

  @override
  String get neverSeen => '접속 기록 없음';

  @override
  String get justNow => '방금 전';

  @override
  String minutesAgo(int count) {
    return '$count분 전';
  }

  @override
  String hoursAgo(int count) {
    return '$count시간 전';
  }

  @override
  String daysAgo(int count) {
    return '$count일 전';
  }

  @override
  String get charUnit => '자';

  @override
  String get cutUnit => '컷';

  @override
  String get recordsPrivate => '비공개';

  @override
  String get pomodoroStart => '시작';

  @override
  String get pomodoroPause => '일시정지';

  @override
  String get pomodoroResume => '이어서';

  @override
  String get pomodoroReset => '초기화';

  @override
  String get pomodoroFocusLabel => '집중';

  @override
  String get pomodoroBreakLabel => '휴식';

  @override
  String get minuteUnit => '분';

  @override
  String pomodoroSessions(int count) {
    return '$count회차';
  }

  @override
  String get chatEmpty => '아직 대화가 없어요. 첫 인사를 남겨 보세요 👋';

  @override
  String get chatInputHint => '메시지를 입력하세요';

  @override
  String get chatSend => '전송';

  @override
  String get chatDeleteTitle => '메시지 삭제';

  @override
  String get chatDeleteBody => '이 메시지를 삭제할까요?';

  @override
  String get whisperTag => '귓속말';

  @override
  String get selfLabel => '나';

  @override
  String get unknownUser => '알 수 없음';

  @override
  String recordToday(int count, String unit) {
    return '오늘 $count$unit';
  }

  @override
  String get recordAdd => '더하기';

  @override
  String get recordInputHint => '추가한 글자수(컷수)';

  @override
  String get recordAdded => '기록했어요';

  @override
  String get recordFailed => '기록하지 못했어요.';

  @override
  String get sessionTakenOver =>
      '다른 브라우저(또는 기기)에서 이 방을 이어 사용하기 시작해서, 이 화면의 뽀모도로를 멈췄어요.';

  @override
  String get sessionGuardDuplicateTitle => '이미 다른 곳에서 접속 중이에요';

  @override
  String get sessionGuardDuplicateBody =>
      '같은 계정으로 이 방에 다른 브라우저(또는 기기)에서 이미 접속해 있어요. 두 곳에서 동시에 사용하면 뽀모도로 시간과 글자수 기록이 겹쳐 쌓일 수 있어요.';

  @override
  String get sessionGuardContinueHere => '이 화면에서 계속 사용';

  @override
  String get sessionGuardContinueHint => '다른 곳의 접속은 종료되고, 그쪽 뽀모도로는 멈춰요.';

  @override
  String get sessionGuardLeave => '포룸으로 돌아가기';

  @override
  String get sessionGuardTakenOverTitle => '다른 곳에서 이 방을 이어 사용하고 있어요';

  @override
  String get sessionGuardTakenOverBody =>
      '같은 계정으로 다른 브라우저(또는 기기)에서 이 방에 접속해 이어서 사용하기 시작했어요. 기록이 겹치지 않도록 이 화면의 뽀모도로는 멈췄어요.';

  @override
  String get sessionGuardOk => '포룸으로 이동';
}
