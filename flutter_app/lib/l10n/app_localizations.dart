import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ja.dart';
import 'app_localizations_ko.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of L10n
/// returned by `L10n.of(context)`.
///
/// Applications need to include `L10n.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: L10n.localizationsDelegates,
///   supportedLocales: L10n.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the L10n.supportedLocales
/// property.
abstract class L10n {
  L10n(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static L10n of(BuildContext context) {
    return Localizations.of<L10n>(context, L10n)!;
  }

  static const LocalizationsDelegate<L10n> delegate = _L10nDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ja'),
    Locale('ko'),
    Locale('zh'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In ko, this message translates to:
  /// **'PoRoom'**
  String get appTitle;

  /// No description provided for @tabFeed.
  ///
  /// In ko, this message translates to:
  /// **'피드'**
  String get tabFeed;

  /// No description provided for @tabCompete.
  ///
  /// In ko, this message translates to:
  /// **'도전'**
  String get tabCompete;

  /// No description provided for @tabHome.
  ///
  /// In ko, this message translates to:
  /// **'포룸'**
  String get tabHome;

  /// No description provided for @tabRanking.
  ///
  /// In ko, this message translates to:
  /// **'랭킹'**
  String get tabRanking;

  /// No description provided for @tabRest.
  ///
  /// In ko, this message translates to:
  /// **'휴식'**
  String get tabRest;

  /// No description provided for @myPage.
  ///
  /// In ko, this message translates to:
  /// **'개인'**
  String get myPage;

  /// No description provided for @mailbox.
  ///
  /// In ko, this message translates to:
  /// **'우편함'**
  String get mailbox;

  /// No description provided for @loginSubtitle.
  ///
  /// In ko, this message translates to:
  /// **'화상회의 없이 함께 집중하는\n온라인 뽀모도로 작업실'**
  String get loginSubtitle;

  /// No description provided for @loginGoogle.
  ///
  /// In ko, this message translates to:
  /// **'Google로 시작하기'**
  String get loginGoogle;

  /// No description provided for @loginNote.
  ///
  /// In ko, this message translates to:
  /// **'웹(poroom.kr)과 같은 계정으로 이어서 사용할 수 있어요.'**
  String get loginNote;

  /// No description provided for @loginFailed.
  ///
  /// In ko, this message translates to:
  /// **'로그인하지 못했어요. 다시 시도해 주세요.'**
  String get loginFailed;

  /// No description provided for @profileIncompleteTitle.
  ///
  /// In ko, this message translates to:
  /// **'닉네임과 직업을 먼저 정해 주세요'**
  String get profileIncompleteTitle;

  /// No description provided for @profileIncompleteBody.
  ///
  /// In ko, this message translates to:
  /// **'처음 가입하셨다면 웹에서 닉네임과 직업을 설정한 뒤 앱을 다시 열어 주세요.'**
  String get profileIncompleteBody;

  /// No description provided for @profileIncompleteButton.
  ///
  /// In ko, this message translates to:
  /// **'웹에서 설정하기'**
  String get profileIncompleteButton;

  /// No description provided for @retry.
  ///
  /// In ko, this message translates to:
  /// **'다시 시도'**
  String get retry;

  /// No description provided for @loading.
  ///
  /// In ko, this message translates to:
  /// **'불러오는 중...'**
  String get loading;

  /// No description provided for @loadFailed.
  ///
  /// In ko, this message translates to:
  /// **'불러오지 못했어요.'**
  String get loadFailed;

  /// No description provided for @signOut.
  ///
  /// In ko, this message translates to:
  /// **'로그아웃'**
  String get signOut;

  /// No description provided for @myRooms.
  ///
  /// In ko, this message translates to:
  /// **'내 방'**
  String get myRooms;

  /// No description provided for @openRooms.
  ///
  /// In ko, this message translates to:
  /// **'열린 방'**
  String get openRooms;

  /// No description provided for @noMyRooms.
  ///
  /// In ko, this message translates to:
  /// **'참여 중인 방이 없어요. 아래 열린 방에 들어가 보세요.'**
  String get noMyRooms;

  /// No description provided for @noOpenRooms.
  ///
  /// In ko, this message translates to:
  /// **'지금 들어갈 수 있는 열린 방이 없어요.'**
  String get noOpenRooms;

  /// No description provided for @memberCount.
  ///
  /// In ko, this message translates to:
  /// **'{count}명'**
  String memberCount(int count);

  /// No description provided for @joinRoom.
  ///
  /// In ko, this message translates to:
  /// **'입장'**
  String get joinRoom;

  /// No description provided for @joinFailed.
  ///
  /// In ko, this message translates to:
  /// **'입장하지 못했어요.'**
  String get joinFailed;

  /// No description provided for @systemRoomLabel.
  ///
  /// In ko, this message translates to:
  /// **'시스템 방'**
  String get systemRoomLabel;

  /// No description provided for @comingSoon.
  ///
  /// In ko, this message translates to:
  /// **'준비 중이에요'**
  String get comingSoon;

  /// No description provided for @comingSoonBody.
  ///
  /// In ko, this message translates to:
  /// **'이 화면은 앱에 곧 들어와요. 지금은 웹(poroom.kr)에서 이용해 주세요.'**
  String get comingSoonBody;

  /// No description provided for @openOnWeb.
  ///
  /// In ko, this message translates to:
  /// **'웹에서 열기'**
  String get openOnWeb;

  /// No description provided for @back.
  ///
  /// In ko, this message translates to:
  /// **'뒤로'**
  String get back;

  /// No description provided for @cancel.
  ///
  /// In ko, this message translates to:
  /// **'취소'**
  String get cancel;

  /// No description provided for @close.
  ///
  /// In ko, this message translates to:
  /// **'닫기'**
  String get close;

  /// No description provided for @confirm.
  ///
  /// In ko, this message translates to:
  /// **'확인'**
  String get confirm;

  /// No description provided for @delete.
  ///
  /// In ko, this message translates to:
  /// **'삭제'**
  String get delete;

  /// No description provided for @roomTabMembers.
  ///
  /// In ko, this message translates to:
  /// **'참여자'**
  String get roomTabMembers;

  /// No description provided for @roomTabChat.
  ///
  /// In ko, this message translates to:
  /// **'채팅'**
  String get roomTabChat;

  /// No description provided for @roomTabRecord.
  ///
  /// In ko, this message translates to:
  /// **'기록'**
  String get roomTabRecord;

  /// No description provided for @roomMenuWeb.
  ///
  /// In ko, this message translates to:
  /// **'일정·투표·게시판·기록 (웹)'**
  String get roomMenuWeb;

  /// No description provided for @roomLeave.
  ///
  /// In ko, this message translates to:
  /// **'방 나가기'**
  String get roomLeave;

  /// No description provided for @roomLeaveConfirmBody.
  ///
  /// In ko, this message translates to:
  /// **'이 방에서 나갈까요?'**
  String get roomLeaveConfirmBody;

  /// No description provided for @roomNotFound.
  ///
  /// In ko, this message translates to:
  /// **'방을 찾을 수 없어요'**
  String get roomNotFound;

  /// No description provided for @roomNotJoined.
  ///
  /// In ko, this message translates to:
  /// **'아직 이 방에 입장하지 않았어요.'**
  String get roomNotJoined;

  /// No description provided for @roomInviteOnly.
  ///
  /// In ko, this message translates to:
  /// **'초대코드로 입장할 수 있는 방이에요.'**
  String get roomInviteOnly;

  /// No description provided for @roomEnter.
  ///
  /// In ko, this message translates to:
  /// **'입장하기'**
  String get roomEnter;

  /// No description provided for @participantsLine.
  ///
  /// In ko, this message translates to:
  /// **'참여자 {count}명 · 접속 중 {online}명'**
  String participantsLine(int count, int online);

  /// No description provided for @participantsLineCap.
  ///
  /// In ko, this message translates to:
  /// **'참여자 {count}/{capacity}명 · 접속 중 {online}명'**
  String participantsLineCap(int count, int capacity, int online);

  /// No description provided for @phaseFocus.
  ///
  /// In ko, this message translates to:
  /// **'집중'**
  String get phaseFocus;

  /// No description provided for @phaseBreak.
  ///
  /// In ko, this message translates to:
  /// **'휴식'**
  String get phaseBreak;

  /// No description provided for @phaseIdle.
  ///
  /// In ko, this message translates to:
  /// **'대기'**
  String get phaseIdle;

  /// No description provided for @lastSeen.
  ///
  /// In ko, this message translates to:
  /// **'{label} 접속'**
  String lastSeen(String label);

  /// No description provided for @neverSeen.
  ///
  /// In ko, this message translates to:
  /// **'접속 기록 없음'**
  String get neverSeen;

  /// No description provided for @justNow.
  ///
  /// In ko, this message translates to:
  /// **'방금 전'**
  String get justNow;

  /// No description provided for @minutesAgo.
  ///
  /// In ko, this message translates to:
  /// **'{count}분 전'**
  String minutesAgo(int count);

  /// No description provided for @hoursAgo.
  ///
  /// In ko, this message translates to:
  /// **'{count}시간 전'**
  String hoursAgo(int count);

  /// No description provided for @daysAgo.
  ///
  /// In ko, this message translates to:
  /// **'{count}일 전'**
  String daysAgo(int count);

  /// No description provided for @charUnit.
  ///
  /// In ko, this message translates to:
  /// **'자'**
  String get charUnit;

  /// No description provided for @cutUnit.
  ///
  /// In ko, this message translates to:
  /// **'컷'**
  String get cutUnit;

  /// No description provided for @recordsPrivate.
  ///
  /// In ko, this message translates to:
  /// **'비공개'**
  String get recordsPrivate;

  /// No description provided for @pomodoroStart.
  ///
  /// In ko, this message translates to:
  /// **'시작'**
  String get pomodoroStart;

  /// No description provided for @pomodoroPause.
  ///
  /// In ko, this message translates to:
  /// **'일시정지'**
  String get pomodoroPause;

  /// No description provided for @pomodoroResume.
  ///
  /// In ko, this message translates to:
  /// **'이어서'**
  String get pomodoroResume;

  /// No description provided for @pomodoroReset.
  ///
  /// In ko, this message translates to:
  /// **'초기화'**
  String get pomodoroReset;

  /// No description provided for @pomodoroFocusLabel.
  ///
  /// In ko, this message translates to:
  /// **'집중'**
  String get pomodoroFocusLabel;

  /// No description provided for @pomodoroBreakLabel.
  ///
  /// In ko, this message translates to:
  /// **'휴식'**
  String get pomodoroBreakLabel;

  /// No description provided for @minuteUnit.
  ///
  /// In ko, this message translates to:
  /// **'분'**
  String get minuteUnit;

  /// No description provided for @pomodoroSessions.
  ///
  /// In ko, this message translates to:
  /// **'{count}회차'**
  String pomodoroSessions(int count);

  /// No description provided for @chatEmpty.
  ///
  /// In ko, this message translates to:
  /// **'아직 대화가 없어요. 첫 인사를 남겨 보세요 👋'**
  String get chatEmpty;

  /// No description provided for @chatInputHint.
  ///
  /// In ko, this message translates to:
  /// **'메시지를 입력하세요'**
  String get chatInputHint;

  /// No description provided for @chatSend.
  ///
  /// In ko, this message translates to:
  /// **'전송'**
  String get chatSend;

  /// No description provided for @chatDeleteTitle.
  ///
  /// In ko, this message translates to:
  /// **'메시지 삭제'**
  String get chatDeleteTitle;

  /// No description provided for @chatDeleteBody.
  ///
  /// In ko, this message translates to:
  /// **'이 메시지를 삭제할까요?'**
  String get chatDeleteBody;

  /// No description provided for @whisperTag.
  ///
  /// In ko, this message translates to:
  /// **'귓속말'**
  String get whisperTag;

  /// No description provided for @selfLabel.
  ///
  /// In ko, this message translates to:
  /// **'나'**
  String get selfLabel;

  /// No description provided for @unknownUser.
  ///
  /// In ko, this message translates to:
  /// **'알 수 없음'**
  String get unknownUser;

  /// No description provided for @recordToday.
  ///
  /// In ko, this message translates to:
  /// **'오늘 {count}{unit}'**
  String recordToday(int count, String unit);

  /// No description provided for @recordAdd.
  ///
  /// In ko, this message translates to:
  /// **'더하기'**
  String get recordAdd;

  /// No description provided for @recordInputHint.
  ///
  /// In ko, this message translates to:
  /// **'추가한 글자수(컷수)'**
  String get recordInputHint;

  /// No description provided for @recordAdded.
  ///
  /// In ko, this message translates to:
  /// **'기록했어요'**
  String get recordAdded;

  /// No description provided for @recordFailed.
  ///
  /// In ko, this message translates to:
  /// **'기록하지 못했어요.'**
  String get recordFailed;

  /// No description provided for @sessionTakenOver.
  ///
  /// In ko, this message translates to:
  /// **'다른 브라우저(또는 기기)에서 이 방을 이어 사용하기 시작해서, 이 화면의 뽀모도로를 멈췄어요.'**
  String get sessionTakenOver;

  /// No description provided for @sessionGuardDuplicateTitle.
  ///
  /// In ko, this message translates to:
  /// **'이미 다른 곳에서 접속 중이에요'**
  String get sessionGuardDuplicateTitle;

  /// No description provided for @sessionGuardDuplicateBody.
  ///
  /// In ko, this message translates to:
  /// **'같은 계정으로 이 방에 다른 브라우저(또는 기기)에서 이미 접속해 있어요. 두 곳에서 동시에 사용하면 뽀모도로 시간과 글자수 기록이 겹쳐 쌓일 수 있어요.'**
  String get sessionGuardDuplicateBody;

  /// No description provided for @sessionGuardContinueHere.
  ///
  /// In ko, this message translates to:
  /// **'이 화면에서 계속 사용'**
  String get sessionGuardContinueHere;

  /// No description provided for @sessionGuardContinueHint.
  ///
  /// In ko, this message translates to:
  /// **'다른 곳의 접속은 종료되고, 그쪽 뽀모도로는 멈춰요.'**
  String get sessionGuardContinueHint;

  /// No description provided for @sessionGuardLeave.
  ///
  /// In ko, this message translates to:
  /// **'포룸으로 돌아가기'**
  String get sessionGuardLeave;

  /// No description provided for @sessionGuardTakenOverTitle.
  ///
  /// In ko, this message translates to:
  /// **'다른 곳에서 이 방을 이어 사용하고 있어요'**
  String get sessionGuardTakenOverTitle;

  /// No description provided for @sessionGuardTakenOverBody.
  ///
  /// In ko, this message translates to:
  /// **'같은 계정으로 다른 브라우저(또는 기기)에서 이 방에 접속해 이어서 사용하기 시작했어요. 기록이 겹치지 않도록 이 화면의 뽀모도로는 멈췄어요.'**
  String get sessionGuardTakenOverBody;

  /// No description provided for @sessionGuardOk.
  ///
  /// In ko, this message translates to:
  /// **'포룸으로 이동'**
  String get sessionGuardOk;

  /// No description provided for @feedCatAll.
  ///
  /// In ko, this message translates to:
  /// **'전체'**
  String get feedCatAll;

  /// No description provided for @feedCatWrite.
  ///
  /// In ko, this message translates to:
  /// **'작업'**
  String get feedCatWrite;

  /// No description provided for @feedCatDuel.
  ///
  /// In ko, this message translates to:
  /// **'대결'**
  String get feedCatDuel;

  /// No description provided for @feedCatChallenge.
  ///
  /// In ko, this message translates to:
  /// **'챌린지'**
  String get feedCatChallenge;

  /// No description provided for @feedCatSubmission.
  ///
  /// In ko, this message translates to:
  /// **'투고'**
  String get feedCatSubmission;

  /// No description provided for @feedCatContest.
  ///
  /// In ko, this message translates to:
  /// **'공모전'**
  String get feedCatContest;

  /// No description provided for @feedMoodHint.
  ///
  /// In ko, this message translates to:
  /// **'오늘의 기분이나 소식을 남겨 보세요'**
  String get feedMoodHint;

  /// No description provided for @feedPost.
  ///
  /// In ko, this message translates to:
  /// **'올리기'**
  String get feedPost;

  /// No description provided for @feedPostFailed.
  ///
  /// In ko, this message translates to:
  /// **'글을 올리지 못했어요.'**
  String get feedPostFailed;

  /// No description provided for @feedEmpty.
  ///
  /// In ko, this message translates to:
  /// **'아직 글이 없어요.'**
  String get feedEmpty;

  /// No description provided for @feedWriteOnWebHint.
  ///
  /// In ko, this message translates to:
  /// **'이 분류의 글은 웹에서 쓸 수 있어요.'**
  String get feedWriteOnWebHint;

  /// No description provided for @feedDeleteConfirm.
  ///
  /// In ko, this message translates to:
  /// **'이 글을 삭제할까요?'**
  String get feedDeleteConfirm;

  /// No description provided for @feedMinutesFocus.
  ///
  /// In ko, this message translates to:
  /// **'{count}분 집중'**
  String feedMinutesFocus(int count);

  /// No description provided for @feedWin.
  ///
  /// In ko, this message translates to:
  /// **'승'**
  String get feedWin;

  /// No description provided for @feedLoss.
  ///
  /// In ko, this message translates to:
  /// **'패'**
  String get feedLoss;

  /// No description provided for @feedDraw.
  ///
  /// In ko, this message translates to:
  /// **'무'**
  String get feedDraw;

  /// No description provided for @feedAchieved.
  ///
  /// In ko, this message translates to:
  /// **'달성'**
  String get feedAchieved;

  /// No description provided for @feedNotAchieved.
  ///
  /// In ko, this message translates to:
  /// **'미달성'**
  String get feedNotAchieved;

  /// No description provided for @rankTabChars.
  ///
  /// In ko, this message translates to:
  /// **'글자수'**
  String get rankTabChars;

  /// No description provided for @rankTabChallenge.
  ///
  /// In ko, this message translates to:
  /// **'챌린지'**
  String get rankTabChallenge;

  /// No description provided for @rankTabTyping.
  ///
  /// In ko, this message translates to:
  /// **'타자'**
  String get rankTabTyping;

  /// No description provided for @rankScopeUser.
  ///
  /// In ko, this message translates to:
  /// **'개인'**
  String get rankScopeUser;

  /// No description provided for @rankScopeRoom.
  ///
  /// In ko, this message translates to:
  /// **'방'**
  String get rankScopeRoom;

  /// No description provided for @rankPeriodDay.
  ///
  /// In ko, this message translates to:
  /// **'일별'**
  String get rankPeriodDay;

  /// No description provided for @rankPeriodMonth.
  ///
  /// In ko, this message translates to:
  /// **'월별'**
  String get rankPeriodMonth;

  /// No description provided for @rankPeriodYear.
  ///
  /// In ko, this message translates to:
  /// **'연별'**
  String get rankPeriodYear;

  /// No description provided for @rankDateDay.
  ///
  /// In ko, this message translates to:
  /// **'{month}월 {day}일'**
  String rankDateDay(int month, int day);

  /// No description provided for @rankDateMonth.
  ///
  /// In ko, this message translates to:
  /// **'{year}년 {month}월'**
  String rankDateMonth(int year, int month);

  /// No description provided for @rankDateYear.
  ///
  /// In ko, this message translates to:
  /// **'{year}년'**
  String rankDateYear(int year);

  /// No description provided for @rankScoreValue.
  ///
  /// In ko, this message translates to:
  /// **'{score}점'**
  String rankScoreValue(String score);

  /// No description provided for @rankCpmValue.
  ///
  /// In ko, this message translates to:
  /// **'{cpm}타/분'**
  String rankCpmValue(int cpm);

  /// No description provided for @rankMyRank.
  ///
  /// In ko, this message translates to:
  /// **'내 순위 {rank}위 / {total}명 · {value}'**
  String rankMyRank(int rank, int total, String value);

  /// No description provided for @rankEmpty.
  ///
  /// In ko, this message translates to:
  /// **'집계된 기록이 없어요.'**
  String get rankEmpty;

  /// No description provided for @rankChallengeHint.
  ///
  /// In ko, this message translates to:
  /// **'1천자 1점 · 5천자 2점 · 1만자 3점 · 초단 5점 · 관리자 이벤트 7점'**
  String get rankChallengeHint;

  /// No description provided for @positionNovelist.
  ///
  /// In ko, this message translates to:
  /// **'웹소설'**
  String get positionNovelist;

  /// No description provided for @positionWebtoon.
  ///
  /// In ko, this message translates to:
  /// **'웹툰'**
  String get positionWebtoon;

  /// No description provided for @competeChallenges.
  ///
  /// In ko, this message translates to:
  /// **'챌린지'**
  String get competeChallenges;

  /// No description provided for @competeDuels.
  ///
  /// In ko, this message translates to:
  /// **'대결'**
  String get competeDuels;

  /// No description provided for @competeEmpty.
  ///
  /// In ko, this message translates to:
  /// **'아직 없어요.'**
  String get competeEmpty;

  /// No description provided for @competeJoined.
  ///
  /// In ko, this message translates to:
  /// **'참여 중'**
  String get competeJoined;

  /// No description provided for @competeOpen.
  ///
  /// In ko, this message translates to:
  /// **'참여할 수 있어요'**
  String get competeOpen;

  /// No description provided for @competeCreateOnWeb.
  ///
  /// In ko, this message translates to:
  /// **'대결 만들기·초대코드 입장은 웹에서'**
  String get competeCreateOnWeb;

  /// No description provided for @competeJoinedBadge.
  ///
  /// In ko, this message translates to:
  /// **'참여 중'**
  String get competeJoinedBadge;

  /// No description provided for @competeNotStarted.
  ///
  /// In ko, this message translates to:
  /// **'시작 전'**
  String get competeNotStarted;

  /// No description provided for @competeParticipants.
  ///
  /// In ko, this message translates to:
  /// **'{count}명 참여'**
  String competeParticipants(int count);

  /// No description provided for @competeEnded.
  ///
  /// In ko, this message translates to:
  /// **'종료'**
  String get competeEnded;

  /// No description provided for @competeProgress.
  ///
  /// In ko, this message translates to:
  /// **'오늘 {a} / {b}'**
  String competeProgress(String a, String b);

  /// No description provided for @competeLeave.
  ///
  /// In ko, this message translates to:
  /// **'그만두기'**
  String get competeLeave;

  /// No description provided for @competeJoin.
  ///
  /// In ko, this message translates to:
  /// **'참여하기'**
  String get competeJoin;

  /// No description provided for @restTabBoard.
  ///
  /// In ko, this message translates to:
  /// **'게시판'**
  String get restTabBoard;

  /// No description provided for @restTabGames.
  ///
  /// In ko, this message translates to:
  /// **'게임'**
  String get restTabGames;

  /// No description provided for @restCatInfo.
  ///
  /// In ko, this message translates to:
  /// **'정보'**
  String get restCatInfo;

  /// No description provided for @restCatRecruit.
  ///
  /// In ko, this message translates to:
  /// **'인원 모집'**
  String get restCatRecruit;

  /// No description provided for @restCatFree.
  ///
  /// In ko, this message translates to:
  /// **'자유'**
  String get restCatFree;

  /// No description provided for @restGameTyping.
  ///
  /// In ko, this message translates to:
  /// **'타자 연습'**
  String get restGameTyping;

  /// No description provided for @restGameMinesweeper.
  ///
  /// In ko, this message translates to:
  /// **'지뢰찾기'**
  String get restGameMinesweeper;

  /// No description provided for @restGameTetris.
  ///
  /// In ko, this message translates to:
  /// **'테트리스'**
  String get restGameTetris;

  /// No description provided for @restGameWordChain.
  ///
  /// In ko, this message translates to:
  /// **'끝말잇기'**
  String get restGameWordChain;

  /// No description provided for @restGameChoseong.
  ///
  /// In ko, this message translates to:
  /// **'초성 퀴즈'**
  String get restGameChoseong;

  /// No description provided for @restGamesHint.
  ///
  /// In ko, this message translates to:
  /// **'게임은 웹에서 즐길 수 있어요.'**
  String get restGamesHint;

  /// No description provided for @notesReply.
  ///
  /// In ko, this message translates to:
  /// **'답장'**
  String get notesReply;

  /// No description provided for @notesReplyTo.
  ///
  /// In ko, this message translates to:
  /// **'{name}님에게 답장'**
  String notesReplyTo(String name);

  /// No description provided for @notesPlaceholder.
  ///
  /// In ko, this message translates to:
  /// **'쪽지 내용을 적어 주세요'**
  String get notesPlaceholder;

  /// No description provided for @notesSend.
  ///
  /// In ko, this message translates to:
  /// **'보내기'**
  String get notesSend;

  /// No description provided for @notesSent.
  ///
  /// In ko, this message translates to:
  /// **'쪽지를 보냈어요'**
  String get notesSent;

  /// No description provided for @notesEmpty.
  ///
  /// In ko, this message translates to:
  /// **'받은 쪽지가 없어요.'**
  String get notesEmpty;

  /// No description provided for @meToday.
  ///
  /// In ko, this message translates to:
  /// **'오늘'**
  String get meToday;

  /// No description provided for @meMonth.
  ///
  /// In ko, this message translates to:
  /// **'이번 달'**
  String get meMonth;

  /// No description provided for @meTodos.
  ///
  /// In ko, this message translates to:
  /// **'할 일'**
  String get meTodos;

  /// No description provided for @meTodoHint.
  ///
  /// In ko, this message translates to:
  /// **'할 일 추가'**
  String get meTodoHint;

  /// No description provided for @meNoTodos.
  ///
  /// In ko, this message translates to:
  /// **'할 일이 없어요.'**
  String get meNoTodos;

  /// No description provided for @meOpenWeb.
  ///
  /// In ko, this message translates to:
  /// **'통계·목표·작품은 웹에서 보기'**
  String get meOpenWeb;

  /// No description provided for @challengeDaily1k.
  ///
  /// In ko, this message translates to:
  /// **'매일 1천자 쓰기 챌린지'**
  String get challengeDaily1k;

  /// No description provided for @challengeDaily5k.
  ///
  /// In ko, this message translates to:
  /// **'매일 5천자 쓰기 챌린지'**
  String get challengeDaily5k;

  /// No description provided for @challengeDaily10k.
  ///
  /// In ko, this message translates to:
  /// **'매일 1만자 쓰기 챌린지'**
  String get challengeDaily10k;

  /// No description provided for @challengeMonthlyDraft.
  ///
  /// In ko, this message translates to:
  /// **'매 달 초단 1완고 챌린지'**
  String get challengeMonthlyDraft;

  /// No description provided for @guestLoginButton.
  ///
  /// In ko, this message translates to:
  /// **'로그인'**
  String get guestLoginButton;

  /// No description provided for @loginRequiredTitle.
  ///
  /// In ko, this message translates to:
  /// **'로그인이 필요해요'**
  String get loginRequiredTitle;

  /// No description provided for @loginRequiredBody.
  ///
  /// In ko, this message translates to:
  /// **'로그인하지 않으면 둘러보기만 할 수 있어요. 글쓰기·반응·방 입장 같은 기능은 로그인한 뒤에 쓸 수 있어요.'**
  String get loginRequiredBody;

  /// No description provided for @guestViewerBanner.
  ///
  /// In ko, this message translates to:
  /// **'보기 전용 · 로그인하면 모든 기능을 쓸 수 있어요'**
  String get guestViewerBanner;

  /// No description provided for @homeGreeting.
  ///
  /// In ko, this message translates to:
  /// **'오늘도 함께 집중해요'**
  String get homeGreeting;

  /// No description provided for @homeGreetingSub.
  ///
  /// In ko, this message translates to:
  /// **'지금 작업 중인 작가들과 함께해 보세요.'**
  String get homeGreetingSub;

  /// No description provided for @homeSystemRoomSub.
  ///
  /// In ko, this message translates to:
  /// **'지금 참여할 수 있는 상시 작업방'**
  String get homeSystemRoomSub;

  /// No description provided for @homeDawnRoom.
  ///
  /// In ko, this message translates to:
  /// **'새벽 작업방'**
  String get homeDawnRoom;

  /// No description provided for @homeDeadlineRoom.
  ///
  /// In ko, this message translates to:
  /// **'마감 작업방'**
  String get homeDeadlineRoom;

  /// No description provided for @homeEnterRoom.
  ///
  /// In ko, this message translates to:
  /// **'작업방 입장하기'**
  String get homeEnterRoom;

  /// No description provided for @homeRecommendedRooms.
  ///
  /// In ko, this message translates to:
  /// **'추천 작업방'**
  String get homeRecommendedRooms;

  /// No description provided for @homeSeeAll.
  ///
  /// In ko, this message translates to:
  /// **'전체 보기'**
  String get homeSeeAll;

  /// No description provided for @homeMyLife.
  ///
  /// In ko, this message translates to:
  /// **'나의 집필 생활'**
  String get homeMyLife;

  /// No description provided for @homeLoginForDashboard.
  ///
  /// In ko, this message translates to:
  /// **'로그인하면 오늘의 목표와 집필 기록을 여기서 볼 수 있어요.'**
  String get homeLoginForDashboard;

  /// No description provided for @homeTodayGoal.
  ///
  /// In ko, this message translates to:
  /// **'오늘의 목표'**
  String get homeTodayGoal;

  /// No description provided for @homeGoalAchieved.
  ///
  /// In ko, this message translates to:
  /// **'목표의 {percent}% 달성'**
  String homeGoalAchieved(int percent);

  /// No description provided for @homeNoGoal.
  ///
  /// In ko, this message translates to:
  /// **'목표는 웹의 [개인]에서 정할 수 있어요'**
  String get homeNoGoal;

  /// No description provided for @homeFocusToday.
  ///
  /// In ko, this message translates to:
  /// **'오늘 집중 시간'**
  String get homeFocusToday;

  /// No description provided for @homeStreak.
  ///
  /// In ko, this message translates to:
  /// **'연속 집필'**
  String get homeStreak;

  /// No description provided for @homeDays.
  ///
  /// In ko, this message translates to:
  /// **'{count}일'**
  String homeDays(int count);

  /// No description provided for @homeMinutesOnly.
  ///
  /// In ko, this message translates to:
  /// **'{minutes}분'**
  String homeMinutesOnly(int minutes);

  /// No description provided for @homeHoursOnly.
  ///
  /// In ko, this message translates to:
  /// **'{hours}시간'**
  String homeHoursOnly(int hours);

  /// No description provided for @homeHoursMinutes.
  ///
  /// In ko, this message translates to:
  /// **'{hours}시간 {minutes}분'**
  String homeHoursMinutes(int hours, int minutes);

  /// No description provided for @homeChallenges.
  ///
  /// In ko, this message translates to:
  /// **'참여 중인 챌린지'**
  String get homeChallenges;

  /// No description provided for @homeSeeDetail.
  ///
  /// In ko, this message translates to:
  /// **'자세히 보기'**
  String get homeSeeDetail;

  /// No description provided for @homeNoChallenge.
  ///
  /// In ko, this message translates to:
  /// **'참여 중인 챌린지가 없어요. [도전]에서 참여해 보세요.'**
  String get homeNoChallenge;

  /// No description provided for @homeFeedTitle.
  ///
  /// In ko, this message translates to:
  /// **'작가들의 피드'**
  String get homeFeedTitle;

  /// No description provided for @homeCountSuffix.
  ///
  /// In ko, this message translates to:
  /// **'명'**
  String get homeCountSuffix;

  /// No description provided for @homeChallengeDone.
  ///
  /// In ko, this message translates to:
  /// **'오늘 목표를 달성했어요 🎉'**
  String get homeChallengeDone;

  /// No description provided for @homeChallengeRemaining.
  ///
  /// In ko, this message translates to:
  /// **'오늘 목표까지 {remaining} 남았어요'**
  String homeChallengeRemaining(String remaining);
}

class _L10nDelegate extends LocalizationsDelegate<L10n> {
  const _L10nDelegate();

  @override
  Future<L10n> load(Locale locale) {
    return SynchronousFuture<L10n>(lookupL10n(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ja', 'ko', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_L10nDelegate old) => false;
}

L10n lookupL10n(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return L10nEn();
    case 'ja':
      return L10nJa();
    case 'ko':
      return L10nKo();
    case 'zh':
      return L10nZh();
  }

  throw FlutterError(
    'L10n.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
