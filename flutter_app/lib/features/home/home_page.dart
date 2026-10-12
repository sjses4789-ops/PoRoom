import 'package:flutter/material.dart';

import '../../core/auth_controller.dart';
import '../../core/theme.dart';
import '../../l10n/app_localizations.dart';
import '../../shell/bottom_bar.dart';
import '../../shell/shell_nav.dart';
import '../../widgets/character_avatar.dart';
import '../../widgets/common.dart';
import '../../widgets/login_gate.dart';
import '../feed/feed_models.dart';
import '../rooms/room_models.dart';
import '../rooms/room_page.dart';
import '../rooms/room_repository.dart';
import '../rooms/rooms_page.dart';
import 'home_repository.dart';

// [포룸] 탭(홈) — 인사, 지금 들어갈 수 있는 상시 작업방, 추천 작업방, 그리고 "나의 집필 생활" 요약.
// 로그인 전(보기 전용)에는 작업방만 보이고, 집필 요약 자리에는 로그인 안내가 나온다.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late RoomRepository _rooms;
  late HomeRepository _home;
  Future<List<RoomSummary>>? _roomsFuture;
  Future<HomeDashboard>? _dashFuture;
  bool _joiningSystem = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_roomsFuture == null) {
      final auth = AuthScope.of(context);
      _rooms = RoomRepository(auth.userId ?? '');
      _home = HomeRepository(auth.userId ?? '');
      _load(auth.isGuest);
    }
  }

  void _load(bool guest) {
    _roomsFuture = _rooms.fetchRooms();
    _dashFuture = guest ? null : _home.fetchDashboard();
    setState(() {});
  }

  Future<void> _refresh() async {
    _load(AuthScope.of(context).isGuest);
    await _roomsFuture;
  }

  Future<void> _openRoom(RoomSummary room) async {
    if (!await requireLogin(context)) return;
    if (!mounted) return;
    await Navigator.of(context)
        .push(MaterialPageRoute<void>(builder: (_) => RoomPage(room: room)));
    if (mounted) _load(AuthScope.of(context).isGuest);
  }

  // 마감방/새벽방 입장 — 이미 참여 중이면 바로 열고, 아니면 입장한 뒤 연다.
  Future<void> _enterSystemRoom(String kind, RoomSummary? existing) async {
    if (!await requireLogin(context)) return;
    if (!mounted || _joiningSystem) return;
    if (existing != null && existing.isMember) {
      _openRoom(existing);
      return;
    }
    setState(() => _joiningSystem = true);
    final roomId = await _rooms.joinSystemRoom(kind);
    if (!mounted) return;
    setState(() => _joiningSystem = false);
    if (roomId == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(L10n.of(context).joinFailed)));
      return;
    }
    final list = await _rooms.fetchRooms();
    if (!mounted) return;
    final joined = list.where((r) => r.id == roomId);
    _load(false);
    if (joined.isNotEmpty) _openRoom(joined.first);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final guest = AuthScope.of(context).isGuest;
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
        children: [
          Row(
            children: [
              Flexible(
                child: Text(
                  l10n.homeGreeting,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              const Text('✍️', style: TextStyle(fontSize: 20)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            l10n.homeGreetingSub,
            style: TextStyle(fontSize: 14, color: pal.subtext),
          ),
          const SizedBox(height: 16),
          FutureBuilder<List<RoomSummary>>(
            future: _roomsFuture,
            builder: (context, snap) {
              final rooms = snap.data ?? const <RoomSummary>[];
              final loaded = snap.connectionState == ConnectionState.done;
              if (snap.hasError) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    children: [
                      Text(l10n.loadFailed, style: TextStyle(color: pal.muted)),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        onPressed: _refresh,
                        child: Text(l10n.retry),
                      ),
                    ],
                  ),
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _systemRoomCard(context, rooms),
                  const SizedBox(height: 22),
                  _SectionHeader(
                    title: l10n.homeRecommendedRooms,
                    actionLabel: l10n.homeSeeAll,
                    onAction: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const AllRoomsPage(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (!loaded)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text(
                          l10n.loading,
                          style: TextStyle(color: pal.muted),
                        ),
                      ),
                    )
                  else ...[
                    ..._recommended(rooms).map(
                      (r) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _RoomTile(room: r, onTap: () => _openRoom(r)),
                      ),
                    ),
                    if (_recommended(rooms).isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: Text(
                          l10n.noOpenRooms,
                          style: TextStyle(fontSize: 13, color: pal.muted),
                        ),
                      ),
                  ],
                ],
              );
            },
          ),
          const SizedBox(height: 14),
          _SectionHeader(title: l10n.homeMyLife),
          const SizedBox(height: 10),
          if (guest) _loginCard(context) else _dashboard(context),
        ],
      ),
    );
  }

  // 내 방을 먼저, 그다음 사람이 많은 열린 방 — 상시 방(마감방/새벽방)은 위의 카드가 따로 맡는다.
  List<RoomSummary> _recommended(List<RoomSummary> rooms) {
    final mine = rooms.where((r) => r.isMember && !r.isSystem).toList();
    final open =
        rooms.where((r) => !r.isMember && r.isOpen && !r.isSystem).toList()
          ..sort((a, b) => b.memberCount.compareTo(a.memberCount));
    return [...mine, ...open].take(3).toList();
  }

  // 밤~오전에는 새벽방, 낮~저녁에는 마감방을 "지금 참여할 수 있는 상시 작업방"으로 보여 준다.
  Widget _systemRoomCard(BuildContext context, List<RoomSummary> rooms) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final hour = DateTime.now().hour;
    final dawn = hour < 11 || hour >= 22;
    final kind = dawn ? 'dawn' : 'deadline';
    final koName = dawn ? '새벽방' : '마감방';
    RoomSummary? existing;
    for (final r in rooms) {
      if (r.isSystem && r.name == koName) existing = r;
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.tintRose,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                dawn ? Icons.nightlight_round : Icons.alarm_rounded,
                color: kBrand,
                size: 26,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dawn ? l10n.homeDawnRoom : l10n.homeDeadlineRoom,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      existing != null
                          ? '${l10n.homeSystemRoomSub} · ${l10n.memberCount(existing.memberCount)}'
                          : l10n.homeSystemRoomSub,
                      style: TextStyle(fontSize: 13, color: pal.subtext),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: FilledButton(
              onPressed: _joiningSystem
                  ? null
                  : () => _enterSystemRoom(kind, existing),
              style: FilledButton.styleFrom(
                backgroundColor: pal.lineStrong,
                foregroundColor: pal.bg,
                shape: const StadiumBorder(),
              ),
              child: _joiningSystem
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(
                      l10n.homeEnterRoom,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _loginCard(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.tintLavender,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Text(
            l10n.homeLoginForDashboard,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, height: 1.5, color: pal.subtext),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () => openLogin(context),
            child: Text(l10n.guestLoginButton),
          ),
        ],
      ),
    );
  }

  Widget _dashboard(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return FutureBuilder<HomeDashboard>(
      future: _dashFuture,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(l10n.loading, style: TextStyle(color: pal.muted)),
            ),
          );
        }
        final d = snap.data;
        if (d == null) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(l10n.loadFailed, style: TextStyle(color: pal.muted)),
            ),
          );
        }
        final position = AuthScope.of(context).profile?.position;
        final unit = position == 'webtoon' ? l10n.cutUnit : l10n.charUnit;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _GoalCard(data: d, unit: unit),
            const SizedBox(height: 12),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.timer_outlined,
                      iconColor: const Color(0xFF8B8BC0),
                      label: l10n.homeFocusToday,
                      value: _duration(l10n, d.todayMinutes),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.local_fire_department_outlined,
                      iconColor: const Color(0xFFD08060),
                      label: l10n.homeStreak,
                      value: l10n.homeDays(d.streak),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            _SectionHeader(
              title: l10n.homeChallenges,
              actionLabel: l10n.homeSeeDetail,
              onAction: () => ShellNav.maybeOf(context)?.goTo(AppTab.compete),
            ),
            const SizedBox(height: 10),
            if (d.challenges.isEmpty)
              BorderedCard(
                onTap: () => ShellNav.maybeOf(context)?.goTo(AppTab.compete),
                child: Text(
                  l10n.homeNoChallenge,
                  style: TextStyle(
                    fontSize: 13.5,
                    height: 1.5,
                    color: pal.subtext,
                  ),
                ),
              )
            else
              for (final c in d.challenges) _ChallengeTile(progress: c),
            const SizedBox(height: 22),
            _SectionHeader(
              title: l10n.homeFeedTitle,
              trailing: Icons.north_east_rounded,
              onAction: () => ShellNav.maybeOf(context)?.goTo(AppTab.feed),
            ),
            const SizedBox(height: 10),
            if (d.feed.isEmpty)
              Text(
                l10n.feedEmpty,
                style: TextStyle(fontSize: 13, color: pal.muted),
              )
            else
              for (final p in d.feed)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _FeedPreview(
                    post: p,
                    onTap: () => ShellNav.maybeOf(context)?.goTo(AppTab.feed),
                  ),
                ),
          ],
        );
      },
    );
  }

  String _duration(L10n l10n, int minutes) {
    if (minutes < 60) return l10n.homeMinutesOnly(minutes);
    final m = minutes % 60;
    return m == 0
        ? l10n.homeHoursOnly(minutes ~/ 60)
        : l10n.homeHoursMinutes(minutes ~/ 60, m);
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    this.actionLabel,
    this.onAction,
    this.trailing,
  });

  final String title;
  final String? actionLabel;
  final IconData? trailing;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.2,
            ),
          ),
        ),
        if (actionLabel != null || trailing != null)
          InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: onAction,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: Row(
                children: [
                  if (actionLabel != null)
                    Text(
                      actionLabel!,
                      style: TextStyle(fontSize: 13.5, color: pal.subtext),
                    ),
                  if (actionLabel != null) const SizedBox(width: 2),
                  Icon(
                    trailing ?? Icons.arrow_forward_rounded,
                    size: 16,
                    color: pal.subtext,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _RoomTile extends StatelessWidget {
  const _RoomTile({required this.room, required this.onTap});

  final RoomSummary room;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final count = room.capacity != null
        ? '${room.memberCount} / ${room.capacity}${l10n.homeCountSuffix}'
        : l10n.memberCount(room.memberCount);
    return BorderedCard(
      onTap: onTap,
      padding: const EdgeInsets.fromLTRB(16, 14, 14, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: roomColor(room.color).withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.meeting_room_outlined,
                  color: roomColor(room.color),
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      room.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (room.tags.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          room.tags.take(3).map((t) => '#$t').join(' '),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12.5, color: pal.muted),
                        ),
                      ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: pal.muted),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              if (room.isMember)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: pal.surfaceAlt,
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Text(
                    l10n.competeJoinedBadge,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: pal.subtext,
                    ),
                  ),
                ),
              const Spacer(),
              Text(count, style: TextStyle(fontSize: 13, color: pal.subtext)),
            ],
          ),
        ],
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard({required this.data, required this.unit});

  final HomeDashboard data;
  final String unit;

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final hasGoal = data.goalChars > 0;
    final ratio = hasGoal
        ? (data.todayChars / data.goalChars).clamp(0, 1).toDouble()
        : 0.0;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.tintLavender,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.homeTodayGoal,
            style: TextStyle(fontSize: 14, color: pal.subtext),
          ),
          const SizedBox(height: 6),
          Text(
            hasGoal
                ? '${formatNumber(data.todayChars)} / ${formatNumber(data.goalChars)}$unit'
                : '${formatNumber(data.todayChars)}$unit',
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: ratio,
              minHeight: 10,
              backgroundColor: pal.line.withValues(alpha: 0.7),
              color: kBrand,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  hasGoal
                      ? l10n.homeGoalAchieved((ratio * 100).round())
                      : l10n.homeNoGoal,
                  style: TextStyle(fontSize: 12.5, color: pal.subtext),
                ),
              ),
              Icon(Icons.trending_up_rounded, size: 18, color: pal.subtext),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return BorderedCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 10),
          Text(label, style: TextStyle(fontSize: 13.5, color: pal.subtext)),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChallengeTile extends StatelessWidget {
  const _ChallengeTile({required this.progress});

  final ChallengeProgress progress;

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final title = switch (progress.kind) {
      'daily1k' => l10n.challengeDaily1k,
      'daily5k' => l10n.challengeDaily5k,
      _ => l10n.challengeDaily10k,
    };
    final remaining = (progress.target - progress.todayChars).clamp(
      0,
      progress.target,
    );
    final done = remaining == 0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: BorderedCard(
        onTap: () => ShellNav.maybeOf(context)?.goTo(AppTab.compete),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1DC),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.emoji_events_outlined,
                color: Color(0xFFC9892B),
                size: 24,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    done
                        ? l10n.homeChallengeDone
                        : l10n.homeChallengeRemaining(formatNumber(remaining)),
                    style: TextStyle(fontSize: 12.5, color: pal.subtext),
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(99),
                    child: LinearProgressIndicator(
                      value: (progress.todayChars / progress.target)
                          .clamp(0, 1)
                          .toDouble(),
                      minHeight: 7,
                      backgroundColor: pal.line,
                      color: done
                          ? const Color(0xFF10B981)
                          : const Color(0xFFC9A26A),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeedPreview extends StatelessWidget {
  const _FeedPreview({required this.post, required this.onTap});

  final FeedPostItem post;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final hearts = post.reactions['heart']?.count ?? 0;
    final unit = post.authorPosition == 'webtoon'
        ? l10n.cutUnit
        : l10n.charUnit;
    final sub = [
      if (post.focusMinutes > 0) l10n.feedMinutesFocus(post.focusMinutes),
      if (post.chars > 0) '${formatNumber(post.chars)}$unit',
    ].join(' · ');
    return BorderedCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CharacterAvatar(characterId: post.characterId, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.authorName,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  post.mood,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13.5,
                    height: 1.4,
                    color: pal.subtext,
                  ),
                ),
                if (sub.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      sub,
                      style: TextStyle(fontSize: 12, color: pal.muted),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            children: [
              Icon(Icons.favorite_border_rounded, size: 20, color: pal.muted),
              if (hearts > 0)
                Text(
                  '$hearts',
                  style: TextStyle(fontSize: 11.5, color: pal.muted),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
