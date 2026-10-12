import 'package:flutter/material.dart';

import '../../core/auth_controller.dart';
import '../../core/theme.dart';
import '../../l10n/app_localizations.dart';
import 'room_models.dart';
import 'room_page.dart';
import 'room_repository.dart';

// [포룸] 탭 — 내가 참여 중인 방과 들어갈 수 있는 열린 방.
class RoomsPage extends StatefulWidget {
  const RoomsPage({super.key});

  @override
  State<RoomsPage> createState() => _RoomsPageState();
}

class _RoomsPageState extends State<RoomsPage> {
  late RoomRepository _repo;
  Future<List<RoomSummary>>? _future;
  String? _joiningId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_future == null) {
      _repo = RoomRepository(AuthScope.of(context).userId ?? '');
      _future = _repo.fetchRooms();
    }
  }

  Future<void> _reload() async {
    setState(() => _future = _repo.fetchRooms());
    await _future;
  }

  Future<void> _open(RoomSummary room) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => RoomPage(room: room)));
    if (mounted) _reload();
  }

  Future<void> _join(RoomSummary room) async {
    final l10n = L10n.of(context);
    setState(() => _joiningId = room.id);
    final ok = await _repo.joinOpenRoom(room.id);
    if (!mounted) return;
    setState(() => _joiningId = null);
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.joinFailed)));
      return;
    }
    await _reload();
    if (!mounted) return;
    final joined = (await _future)?.where((r) => r.id == room.id);
    if (joined != null && joined.isNotEmpty) _open(joined.first);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return RefreshIndicator(
      onRefresh: _reload,
      child: FutureBuilder<List<RoomSummary>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return ListView(children: [
              const SizedBox(height: 120),
              Center(child: Text(l10n.loading, style: TextStyle(color: pal.muted))),
            ]);
          }
          if (snap.hasError) {
            return ListView(children: [
              const SizedBox(height: 120),
              Center(child: Text(l10n.loadFailed, style: TextStyle(color: pal.muted))),
              const SizedBox(height: 12),
              Center(child: OutlinedButton(onPressed: _reload, child: Text(l10n.retry))),
            ]);
          }
          final rooms = snap.data ?? const [];
          final mine = rooms.where((r) => r.isMember).toList();
          final open = rooms.where((r) => !r.isMember && r.isOpen).toList();
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              _SectionTitle(l10n.myRooms),
              if (mine.isEmpty) _EmptyHint(l10n.noMyRooms),
              for (final r in mine) _RoomCard(room: r, onTap: () => _open(r)),
              const SizedBox(height: 20),
              _SectionTitle(l10n.openRooms),
              if (open.isEmpty) _EmptyHint(l10n.noOpenRooms),
              for (final r in open)
                _RoomCard(
                  room: r,
                  trailing: SizedBox(
                    height: 32,
                    child: FilledButton(
                      onPressed: _joiningId == null ? () => _join(r) : null,
                      style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 14)),
                      child: _joiningId == r.id
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(l10n.joinRoom),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(text, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
      );
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(text, style: TextStyle(fontSize: 12.5, color: context.pal.muted)),
      );
}

class _RoomCard extends StatelessWidget {
  const _RoomCard({required this.room, this.onTap, this.trailing});

  final RoomSummary room;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: pal.surface,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: pal.muted),
          ),
          child: Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(color: roomColor(room.color), shape: BoxShape.circle),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      room.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      [
                        if (room.isSystem) l10n.systemRoomLabel,
                        if (room.capacity != null)
                          '${l10n.memberCount(room.memberCount)} / ${room.capacity}'
                        else
                          l10n.memberCount(room.memberCount),
                        ...room.tags.take(2).map((t) => '#$t'),
                      ].join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12, color: pal.muted),
                    ),
                  ],
                ),
              ),
              if (trailing != null) ...[const SizedBox(width: 10), trailing!],
            ],
          ),
        ),
      ),
    );
  }
}
