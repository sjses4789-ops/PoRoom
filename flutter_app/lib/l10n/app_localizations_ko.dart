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

  @override
  String get feedCatAll => '전체';

  @override
  String get feedCatWrite => '작업';

  @override
  String get feedCatDuel => '대결';

  @override
  String get feedCatChallenge => '챌린지';

  @override
  String get feedCatSubmission => '투고';

  @override
  String get feedCatContest => '공모전';

  @override
  String get feedMoodHint => '오늘의 기분이나 소식을 남겨 보세요';

  @override
  String get feedPost => '올리기';

  @override
  String get feedPostFailed => '글을 올리지 못했어요.';

  @override
  String get feedEmpty => '아직 글이 없어요.';

  @override
  String get feedWriteOnWebHint => '이 분류의 글은 웹에서 쓸 수 있어요.';

  @override
  String get feedDeleteConfirm => '이 글을 삭제할까요?';

  @override
  String feedMinutesFocus(int count) {
    return '$count분 집중';
  }

  @override
  String get feedWin => '승';

  @override
  String get feedLoss => '패';

  @override
  String get feedDraw => '무';

  @override
  String get feedAchieved => '달성';

  @override
  String get feedNotAchieved => '미달성';

  @override
  String get rankTabChars => '글자수';

  @override
  String get rankTabChallenge => '챌린지';

  @override
  String get rankTabTyping => '타자';

  @override
  String get rankScopeUser => '개인';

  @override
  String get rankScopeRoom => '방';

  @override
  String get rankPeriodDay => '일별';

  @override
  String get rankPeriodMonth => '월별';

  @override
  String get rankPeriodYear => '연별';

  @override
  String rankDateDay(int month, int day) {
    return '$month월 $day일';
  }

  @override
  String rankDateMonth(int year, int month) {
    return '$year년 $month월';
  }

  @override
  String rankDateYear(int year) {
    return '$year년';
  }

  @override
  String rankScoreValue(String score) {
    return '$score점';
  }

  @override
  String rankCpmValue(int cpm) {
    return '$cpm타/분';
  }

  @override
  String rankMyRank(int rank, int total, String value) {
    return '내 순위 $rank위 / $total명 · $value';
  }

  @override
  String get rankEmpty => '집계된 기록이 없어요.';

  @override
  String get rankChallengeHint =>
      '1천자 1점 · 5천자 2점 · 1만자 3점 · 초단 5점 · 관리자 이벤트 7점';

  @override
  String get positionNovelist => '웹소설';

  @override
  String get positionWebtoon => '웹툰';

  @override
  String get competeChallenges => '챌린지';

  @override
  String get competeDuels => '대결';

  @override
  String get competeEmpty => '아직 없어요.';

  @override
  String get competeJoined => '참여 중';

  @override
  String get competeOpen => '참여할 수 있어요';

  @override
  String get competeCreateOnWeb => '대결 만들기·초대코드 입장은 웹에서';

  @override
  String get competeJoinedBadge => '참여 중';

  @override
  String get competeNotStarted => '시작 전';

  @override
  String competeParticipants(int count) {
    return '$count명 참여';
  }

  @override
  String get competeEnded => '종료';

  @override
  String competeProgress(String a, String b) {
    return '오늘 $a / $b';
  }

  @override
  String get competeLeave => '그만두기';

  @override
  String get competeJoin => '참여하기';

  @override
  String get restTabBoard => '게시판';

  @override
  String get restTabGames => '게임';

  @override
  String get restCatInfo => '정보';

  @override
  String get restCatRecruit => '인원 모집';

  @override
  String get restCatFree => '자유';

  @override
  String get restGameTyping => '타자 연습';

  @override
  String get restGameMinesweeper => '지뢰찾기';

  @override
  String get restGameTetris => '테트리스';

  @override
  String get restGameWordChain => '끝말잇기';

  @override
  String get restGameChoseong => '초성 퀴즈';

  @override
  String get restGamesHint => '게임은 웹에서 즐길 수 있어요.';

  @override
  String get notesReply => '답장';

  @override
  String notesReplyTo(String name) {
    return '$name님에게 답장';
  }

  @override
  String get notesPlaceholder => '쪽지 내용을 적어 주세요';

  @override
  String get notesSend => '보내기';

  @override
  String get notesSent => '쪽지를 보냈어요';

  @override
  String get notesEmpty => '받은 쪽지가 없어요.';

  @override
  String get meToday => '오늘';

  @override
  String get meMonth => '이번 달';

  @override
  String get meTodos => '할 일';

  @override
  String get meTodoHint => '할 일 추가';

  @override
  String get meNoTodos => '할 일이 없어요.';

  @override
  String get meOpenWeb => '통계·목표·작품은 웹에서 보기';

  @override
  String get challengeDaily1k => '매일 1천자 쓰기 챌린지';

  @override
  String get challengeDaily5k => '매일 5천자 쓰기 챌린지';

  @override
  String get challengeDaily10k => '매일 1만자 쓰기 챌린지';

  @override
  String get challengeMonthlyDraft => '매 달 초단 1완고 챌린지';

  @override
  String get guestLoginButton => '로그인';

  @override
  String get loginRequiredTitle => '로그인이 필요해요';

  @override
  String get loginRequiredBody =>
      '로그인하지 않으면 둘러보기만 할 수 있어요. 글쓰기·반응·방 입장 같은 기능은 로그인한 뒤에 쓸 수 있어요.';

  @override
  String get guestViewerBanner => '보기 전용 · 로그인하면 모든 기능을 쓸 수 있어요';

  @override
  String get homeGreeting => '오늘도 함께 집중해요';

  @override
  String get homeGreetingSub => '지금 작업 중인 작가들과 함께해 보세요.';

  @override
  String get homeSystemRoomSub => '지금 참여할 수 있는 상시 작업방';

  @override
  String get homeDawnRoom => '새벽 작업방';

  @override
  String get homeDeadlineRoom => '마감 작업방';

  @override
  String get homeEnterRoom => '작업방 입장하기';

  @override
  String get homeRecommendedRooms => '추천 작업방';

  @override
  String get homeSeeAll => '전체 보기';

  @override
  String get homeMyLife => '나의 집필 생활';

  @override
  String get homeLoginForDashboard => '로그인하면 오늘의 목표와 집필 기록을 여기서 볼 수 있어요.';

  @override
  String get homeTodayGoal => '오늘의 목표';

  @override
  String homeGoalAchieved(int percent) {
    return '목표의 $percent% 달성';
  }

  @override
  String get homeNoGoal => '목표는 웹의 [개인]에서 정할 수 있어요';

  @override
  String get homeFocusToday => '오늘 집중 시간';

  @override
  String get homeStreak => '연속 집필';

  @override
  String homeDays(int count) {
    return '$count일';
  }

  @override
  String homeMinutesOnly(int minutes) {
    return '$minutes분';
  }

  @override
  String homeHoursOnly(int hours) {
    return '$hours시간';
  }

  @override
  String homeHoursMinutes(int hours, int minutes) {
    return '$hours시간 $minutes분';
  }

  @override
  String get homeChallenges => '참여 중인 챌린지';

  @override
  String get homeSeeDetail => '자세히 보기';

  @override
  String get homeNoChallenge => '참여 중인 챌린지가 없어요. [도전]에서 참여해 보세요.';

  @override
  String get homeFeedTitle => '작가들의 피드';

  @override
  String get homeCountSuffix => '명';

  @override
  String get homeChallengeDone => '오늘 목표를 달성했어요 🎉';

  @override
  String homeChallengeRemaining(String remaining) {
    return '오늘 목표까지 $remaining 남았어요';
  }

  @override
  String get notifTitle => '알림';

  @override
  String get notifEmpty => '새 알림이 없어요.';

  @override
  String get notifMarkAll => '모두 읽음';

  @override
  String notifWhisper(String from) {
    return '$from님이 귓속말을 보냈어요';
  }

  @override
  String notifWhisperRoom(String room) {
    return '방: $room';
  }

  @override
  String get notifReportResolved => '신고하신 내용이 처리되었어요.';

  @override
  String get notifReportResolvedMessage => '신고하신 메시지(사진)가 처리되었어요.';

  @override
  String notifDuelWin(String title, int total, String value) {
    return '대결 ‘$title’에서 승리했어요! $total명 중 1위 · 내 기록 $value';
  }

  @override
  String notifDuelEnd(String title, int total, int rank, String value) {
    return '대결 ‘$title’이 끝났어요. $total명 중 $rank위 · 내 기록 $value';
  }

  @override
  String notifEventDone(String title, int total, int rank, String value) {
    return '‘$title’ 완주를 축하해요! $total명 중 $rank위 · 내 기록 $value';
  }

  @override
  String notifEventEnd(String title, int total, int rank, String value) {
    return '‘$title’이 끝났어요. $total명 중 $rank위 · 내 기록 $value';
  }

  @override
  String notifAchievementDone(String title) {
    return '‘$title’ 달성을 축하해요!';
  }

  @override
  String notifAchievementMiss(String title) {
    return '‘$title’이 끝났어요. 이번에는 달성하지 못했어요.';
  }

  @override
  String notifUnitChars(String n) {
    return '$n자';
  }

  @override
  String notifUnitCuts(String n) {
    return '$n컷';
  }

  @override
  String notifUnitMinutes(String n) {
    return '$n분';
  }

  @override
  String get weeklyTitle => '지난주 집필 리포트';

  @override
  String weeklyBody(String chars, String minutes, int days, int streak) {
    return '$chars자 · 집중 $minutes분 · 기록한 날 $days일 · 연속 $streak일';
  }
}
