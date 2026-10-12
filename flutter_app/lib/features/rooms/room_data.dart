import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/env.dart';
import '../../core/time_util.dart';

class RoomInfo {
  const RoomInfo({
    required this.id,
    required this.name,
    required this.color,
    required this.joinType,
    required this.isSystem,
    required this.ownerId,
    required this.recordVisibility,
    this.capacity,
  });

  final String id;
  final String name;
  final String color;
  final String joinType;
  final bool isSystem;
  final String ownerId;
  final String recordVisibility; // 'shared' | 'private' | 'free'
  final int? capacity;
}

class RoomMember {
  const RoomMember({
    required this.id,
    required this.name,
    required this.position,
    required this.isOwner,
    required this.isVice,
    required this.recordsVisible,
    required this.todayChars,
    this.characterId,
    this.chatColor,
    this.workStatus,
    this.lastSeenAt,
  });

  final String id;
  final String name;
  final String? characterId;
  final String? chatColor;
  final String? workStatus;
  final String position; // 'novelist' | 'webtoon'
  final bool isOwner;
  final bool isVice;
  final bool recordsVisible;
  final DateTime? lastSeenAt;
  final int todayChars;
}

// 방 정보와 참여자 목록 — 웹의 room/[id]/page.tsx와 같은 조회를 앱에서 직접 한다(RLS 동일 적용).
// 참여자 상태설정·접속 시각이 바뀔 수 있어 30초마다 다시 가져온다.
class RoomDataController extends ChangeNotifier {
  RoomDataController({required this.roomId, required this.selfId}) {
    load();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => load());
  }

  final String roomId;
  final String selfId;

  RoomInfo? room;
  List<RoomMember> members = const [];
  bool loading = true;
  bool notFound = false;
  Timer? _timer;
  bool _disposed = false;

  SupabaseClient get _client => Supabase.instance.client;

  RoomMember? get self {
    for (final m in members) {
      if (m.id == selfId) return m;
    }
    return null;
  }

  Future<void> load() async {
    if (Env.preview) {
      _loadPreview();
      return;
    }
    try {
      final roomRow = await _client
          .from('rooms')
          .select(
            'id,name,color,join_type,capacity,is_system,owner_id,record_visibility',
          )
          .eq('id', roomId)
          .maybeSingle();
      if (roomRow == null) {
        notFound = true;
        loading = false;
        _notify();
        return;
      }
      final memberRows = await _client
          .from('room_members')
          .select(
            'user_id,share_records,last_seen_at,is_vice,nickname,work_status,'
            'users(name,character_id,chat_color,position)',
          )
          .eq('room_id', roomId);

      final visibility = roomRow['record_visibility'] as String? ?? 'shared';
      final visibleIds = <String>[
        for (final m in memberRows)
          if (visibility == 'shared' ||
              m['user_id'] == selfId ||
              (visibility == 'free' && m['share_records'] == true))
            m['user_id'] as String,
      ];
      final todayByUser = <String, int>{};
      if (visibleIds.isNotEmpty) {
        final rows = await _client
            .from('daily_records')
            .select('user_id,chars')
            .inFilter('user_id', visibleIds)
            .eq('record_date', todayKst());
        for (final r in rows) {
          final id = r['user_id'] as String;
          todayByUser[id] = (todayByUser[id] ?? 0) + (r['chars'] as int? ?? 0);
        }
      }

      final isSystem = roomRow['is_system'] as bool? ?? false;
      final ownerId = roomRow['owner_id'] as String;
      room = RoomInfo(
        id: roomRow['id'] as String,
        name: roomRow['name'] as String,
        color: roomRow['color'] as String? ?? 'neutral',
        joinType: roomRow['join_type'] as String? ?? 'invite',
        isSystem: isSystem,
        ownerId: ownerId,
        recordVisibility: visibility,
        capacity: roomRow['capacity'] as int?,
      );
      members = [
        for (final m in memberRows)
          () {
            final user = m['users'] as Map<String, dynamic>?;
            final id = m['user_id'] as String;
            final lastSeen = m['last_seen_at'] as String?;
            return RoomMember(
              id: id,
              name: (m['nickname'] as String?)?.isNotEmpty == true
                  ? m['nickname'] as String
                  : (user?['name'] as String?) ?? '',
              characterId: user?['character_id'] as String?,
              chatColor: user?['chat_color'] as String?,
              workStatus: m['work_status'] as String?,
              position: user?['position'] == 'webtoon' ? 'webtoon' : 'novelist',
              isOwner: !isSystem && id == ownerId,
              isVice: m['is_vice'] as bool? ?? false,
              recordsVisible: visibleIds.contains(id),
              lastSeenAt: lastSeen == null ? null : DateTime.tryParse(lastSeen),
              todayChars: todayByUser[id] ?? 0,
            );
          }(),
      ];
      loading = false;
      _notify();
    } catch (_) {
      loading = false;
      _notify();
    }
  }

  void _loadPreview() {
    room = RoomInfo(
      id: roomId,
      name: '마감 달리는 방',
      color: 'rose',
      joinType: 'open',
      isSystem: false,
      ownerId: selfId,
      recordVisibility: 'shared',
      capacity: 8,
    );
    final now = DateTime.now();
    members = [
      RoomMember(
        id: selfId,
        name: '미리보기',
        characterId: 'char_0001',
        chatColor: 'rose',
        workStatus: '집필중',
        position: 'novelist',
        isOwner: true,
        isVice: false,
        recordsVisible: true,
        todayChars: 3420,
        lastSeenAt: now,
      ),
      RoomMember(
        id: 'u2',
        name: '하루',
        characterId: 'char_0007',
        chatColor: 'sky',
        workStatus: '퇴고중',
        position: 'novelist',
        isOwner: false,
        isVice: true,
        recordsVisible: true,
        todayChars: 5120,
        lastSeenAt: now.subtract(const Duration(minutes: 2)),
      ),
      RoomMember(
        id: 'u3',
        name: '달빛',
        characterId: 'char_0012',
        chatColor: 'emerald',
        position: 'webtoon',
        isOwner: false,
        isVice: false,
        recordsVisible: true,
        todayChars: 12,
        lastSeenAt: now.subtract(const Duration(hours: 5)),
      ),
      RoomMember(
        id: 'u4',
        name: '글쓰는곰',
        characterId: 'char_0020',
        position: 'novelist',
        isOwner: false,
        isVice: false,
        recordsVisible: false,
        todayChars: 0,
      ),
    ];
    loading = false;
    _notify();
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _timer?.cancel();
    super.dispose();
  }
}
