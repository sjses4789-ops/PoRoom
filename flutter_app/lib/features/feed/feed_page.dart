import 'package:flutter/material.dart';

import '../../core/auth_controller.dart';
import '../../core/theme.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/character_avatar.dart';
import '../../widgets/common.dart';
import 'feed_models.dart';
import 'feed_repository.dart';

// [피드] 탭 — 다른 작가들의 소식. 작업 소식("작업")은 앱에서 바로 쓰고, 대결·챌린지·투고·공모전 글은 보기·반응은
// 앱에서 하고 쓰기는 웹에서 한다(선택지가 많은 글이라).
class FeedPage extends StatefulWidget {
  const FeedPage({super.key});

  @override
  State<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends State<FeedPage> {
  late FeedRepository _repo;
  Future<List<FeedPostItem>>? _future;
  List<FeedPostItem> _posts = const [];
  String _category = 'all';
  final _mood = TextEditingController();
  bool _posting = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_future == null) {
      _repo = FeedRepository(AuthScope.of(context).userId ?? '');
      _load();
    }
  }

  @override
  void dispose() {
    _mood.dispose();
    super.dispose();
  }

  void _load() {
    _future = _repo.fetch().then((list) {
      _posts = list;
      return list;
    });
    setState(() {});
  }

  Future<void> _post() async {
    final text = _mood.text.trim();
    if (text.isEmpty || _posting) return;
    setState(() => _posting = true);
    final ok = await _repo.createWritePost(text);
    if (!mounted) return;
    setState(() => _posting = false);
    if (ok) {
      _mood.clear();
      _load();
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(L10n.of(context).feedPostFailed)));
    }
  }

  Future<void> _react(FeedPostItem post, String type) async {
    final cur = post.reactions[type] ?? const FeedReaction(0, false);
    final next = FeedReaction(
      cur.count + (cur.selfActive ? -1 : 1),
      !cur.selfActive,
    );
    setState(
      () => _posts = [
        for (final p in _posts)
          p.id == post.id ? p.withReaction(type, next) : p,
      ],
    );
    await _repo.toggleReaction(post.id, type);
  }

  Future<void> _delete(FeedPostItem post) async {
    final l10n = L10n.of(context);
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(l10n.feedDeleteConfirm),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.delete),
          ),
        ],
      ),
    );
    if (yes != true) return;
    setState(() => _posts = _posts.where((p) => p.id != post.id).toList());
    await _repo.delete(post.id);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    final selfId = AuthScope.of(context).userId;
    final categories = <(String, String)>[
      ('all', l10n.feedCatAll),
      ('write', l10n.feedCatWrite),
      ('duel', l10n.feedCatDuel),
      ('challenge', l10n.feedCatChallenge),
      ('submission', l10n.feedCatSubmission),
      ('contest', l10n.feedCatContest),
    ];
    return Column(
      children: [
        const SizedBox(height: 10),
        ChipRow<String>(
          items: categories,
          selected: _category,
          onSelected: (v) => setState(() => _category = v),
        ),
        const SizedBox(height: 6),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => _load(),
            child: AsyncBody<List<FeedPostItem>>(
              future: _future,
              onRetry: _load,
              builder: (context, _) {
                final visible = _category == 'all'
                    ? _posts
                    : _posts.where((p) => p.postType == _category).toList();
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  children: [
                    if (_category == 'write') _composer(context),
                    if (_category != 'all' && _category != 'write')
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(
                          l10n.feedWriteOnWebHint,
                          style: TextStyle(fontSize: 12, color: pal.muted),
                        ),
                      ),
                    if (visible.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 40),
                        child: Center(
                          child: Text(
                            l10n.feedEmpty,
                            style: TextStyle(fontSize: 13, color: pal.muted),
                          ),
                        ),
                      ),
                    for (final p in visible)
                      _PostCard(
                        post: p,
                        mine: p.authorId == selfId,
                        onReact: (t) => _react(p, t),
                        onDelete: () => _delete(p),
                      ),
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _composer(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: pal.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: pal.line),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _mood,
              maxLength: 300,
              onSubmitted: (_) => _post(),
              decoration: InputDecoration(
                hintText: l10n.feedMoodHint,
                counterText: '',
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(99),
                  borderSide: BorderSide(color: pal.line),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(99),
                  borderSide: BorderSide(color: pal.line),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: _posting ? null : _post,
            style: FilledButton.styleFrom(
              backgroundColor: pal.lineStrong,
              foregroundColor: pal.bg,
              shape: const StadiumBorder(),
            ),
            child: Text(l10n.feedPost),
          ),
        ],
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({
    required this.post,
    required this.mine,
    required this.onReact,
    required this.onDelete,
  });

  final FeedPostItem post;
  final bool mine;
  final ValueChanged<String> onReact;
  final VoidCallback onDelete;

  static const _icons = {
    'write': '✍️',
    'duel': '⚔️',
    'challenge': '🏆',
    'submission': '📮',
    'contest': '🏅',
  };

  String _ago(L10n l10n, DateTime at) {
    final minutes = DateTime.now().difference(at).inMinutes;
    if (minutes < 1) return l10n.justNow;
    if (minutes < 60) return l10n.minutesAgo(minutes);
    if (minutes < 60 * 24) return l10n.hoursAgo(minutes ~/ 60);
    return l10n.daysAgo(minutes ~/ (60 * 24));
  }

  List<Widget> _badges(BuildContext context, L10n l10n) {
    final pal = context.pal;
    Widget pill(String text, {Color? bg, Color? fg}) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg ?? pal.surfaceAlt,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: pal.line),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.w600,
          color: fg ?? pal.subtext,
        ),
      ),
    );
    final unit = post.authorPosition == 'webtoon'
        ? l10n.cutUnit
        : l10n.charUnit;
    final m = post.meta;
    switch (post.postType) {
      case 'write':
        return [
          if (post.focusMinutes > 0)
            pill('⏱ ${l10n.feedMinutesFocus(post.focusMinutes)}'),
          if (post.chars > 0)
            pill(
              '${post.authorPosition == 'webtoon' ? '🎨' : '✍️'} ${formatNumber(post.chars)}$unit',
            ),
        ];
      case 'duel':
        final result = m['result'] as String? ?? 'draw';
        final label = switch (result) {
          'win' => l10n.feedWin,
          'loss' => l10n.feedLoss,
          _ => l10n.feedDraw,
        };
        final rank = m['rank'];
        final total = m['participantCount'];
        return [
          pill(
            '⚔️ ${m['challengeTitle'] ?? ''} · $label${rank != null && total != null ? ' · $rank/$total' : ''}',
            bg: result == 'win'
                ? const Color(0xFFECFDF5)
                : result == 'draw'
                ? null
                : const Color(0xFFFFF1F2),
            fg: result == 'win'
                ? const Color(0xFF047857)
                : result == 'draw'
                ? null
                : const Color(0xFFE11D48),
          ),
        ];
      case 'challenge':
        final achieved = m['achieved'] == true;
        return [
          pill(
            '🏆 ${m['challengeTitle'] ?? ''} · ${achieved ? l10n.feedAchieved : l10n.feedNotAchieved}',
            bg: achieved ? const Color(0xFFECFDF5) : null,
            fg: achieved ? const Color(0xFF047857) : null,
          ),
          if (post.chars > 0)
            pill('✍️ ${formatNumber(post.chars)}${l10n.charUnit}'),
        ];
      case 'submission':
        return [
          pill(
            '📮 ${m['genre'] ?? ''} · ${m['publisherCount'] ?? 0}',
            bg: const Color(0xFFF0F9FF),
            fg: const Color(0xFF0369A1),
          ),
        ];
      case 'contest':
        return [
          pill(
            '🏅 ${m['contestName'] ?? ''}',
            bg: const Color(0xFFFFFBEB),
            fg: const Color(0xFFB45309),
          ),
        ];
    }
    return const [];
  }

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final bg = _bgFromMeta(post.meta['bgColor'] as String?);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg ?? pal.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: pal.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CharacterAvatar(characterId: post.characterId, size: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            post.authorName.isEmpty
                                ? l10n.unknownUser
                                : post.authorName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: bg != null
                                  ? const Color(0xFF171717)
                                  : null,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _icons[post.postType] ?? '',
                          style: const TextStyle(fontSize: 12),
                        ),
                        const Spacer(),
                        Text(
                          _ago(l10n, post.createdAt),
                          style: TextStyle(
                            fontSize: 11,
                            color: bg != null
                                ? const Color(0xFF737373)
                                : pal.muted,
                          ),
                        ),
                        if (mine)
                          InkResponse(
                            onTap: onDelete,
                            radius: 16,
                            child: Padding(
                              padding: const EdgeInsets.only(left: 8),
                              child: Icon(
                                Icons.close_rounded,
                                size: 16,
                                color: pal.muted,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      post.mood,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.45,
                        color: bg != null
                            ? const Color(0xFF262626)
                            : pal.subtext,
                      ),
                    ),
                    Builder(
                      builder: (context) {
                        final badges = _badges(context, l10n);
                        if (badges.isEmpty) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: badges,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.only(left: 46),
            child: Wrap(
              spacing: 6,
              children: [
                for (final type in reactionTypes)
                  _ReactionButton(
                    emoji: reactionEmoji[type]!,
                    reaction:
                        post.reactions[type] ?? const FeedReaction(0, false),
                    onTap: () => onReact(type),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// 작성자가 고른 파스텔 배경(웹 피드와 같은 값). 다크 테마에서도 글자가 읽히도록 밝은 배경 + 어두운 글자를 쓴다.
Color? _bgFromMeta(String? hex) {
  if (hex == null || !hex.startsWith('#') || hex.length != 7) return null;
  final v = int.tryParse(hex.substring(1), radix: 16);
  return v == null ? null : Color(0xFF000000 | v);
}

class _ReactionButton extends StatelessWidget {
  const _ReactionButton({
    required this.emoji,
    required this.reaction,
    required this.onTap,
  });

  final String emoji;
  final FeedReaction reaction;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final on = reaction.selfActive;
    return InkWell(
      borderRadius: BorderRadius.circular(99),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: on ? pal.lineStrong : Colors.transparent,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: on ? pal.lineStrong : pal.line),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 13)),
            if (reaction.count > 0) ...[
              const SizedBox(width: 4),
              Text(
                '${reaction.count}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: on ? pal.bg : pal.subtext,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
