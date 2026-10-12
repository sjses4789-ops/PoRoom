import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/env.dart';
import '../../core/web_api.dart';
import 'room_models.dart';

class RoomRepository {
  RoomRepository(this.selfId);

  final String selfId;

  SupabaseClient get _client => Supabase.instance.client;

  // 방 목록(내가 볼 수 있는 방 전부) + 내가 참여 중인지 + 인원 수. RLS가 그대로 적용된다.
  Future<List<RoomSummary>> fetchRooms() async {
    if (Env.preview) return _previewRooms;

    final rows = await _client
        .from('rooms')
        .select('id,name,color,tags,join_type,target_position,is_system,capacity,created_at')
        .order('created_at', ascending: false)
        .limit(200);

    final ids = [for (final r in rows) r['id'] as String];
    // 인원 수/내 참여 여부는 보이는 방들에 대해서만 센다(전체 멤버십을 읽으면 조회 상한에 걸린다).
    final members = ids.isEmpty
        ? <Map<String, dynamic>>[]
        : List<Map<String, dynamic>>.from(await _client.from('room_members').select('room_id,user_id').inFilter('room_id', ids));
    final countByRoom = <String, int>{};
    final mine = <String>{};
    for (final m in members) {
      final roomId = m['room_id'] as String;
      countByRoom[roomId] = (countByRoom[roomId] ?? 0) + 1;
      if (m['user_id'] == selfId) mine.add(roomId);
    }

    return [
      for (final r in rows)
        RoomSummary(
          id: r['id'] as String,
          name: r['name'] as String,
          color: (r['color'] as String?) ?? 'neutral',
          isSystem: (r['is_system'] as bool?) ?? false,
          joinType: (r['join_type'] as String?) ?? 'invite',
          capacity: r['capacity'] as int?,
          tags: [for (final t in (r['tags'] as List? ?? const [])) t as String],
          targetPosition: r['target_position'] as String?,
          memberCount: countByRoom[r['id']] ?? 0,
          isMember: mine.contains(r['id']),
        ),
    ];
  }

  // 열린 방에 입장 — 웹의 joinOpenRoom 서버 액션을 그대로 부른다(차단·직업 제한 검사 포함).
  // 이 액션은 결과를 돌려주지 않아서, 입장 여부는 호출 뒤 다시 읽어 확인한다.
  Future<bool> joinOpenRoom(String roomId) async {
    if (Env.preview) return true;
    await WebApi.rpc<Object?>('joinOpenRoom', [roomId]);
    final row = await _client
        .from('room_members')
        .select('room_id')
        .eq('room_id', roomId)
        .eq('user_id', selfId)
        .maybeSingle();
    return row != null;
  }
}

const _previewRooms = <RoomSummary>[
  RoomSummary(
    id: 'p1',
    name: '마감 달리는 방',
    color: 'rose',
    isSystem: false,
    joinType: 'open',
    memberCount: 4,
    isMember: true,
    capacity: 8,
    tags: ['웹소설', '마감'],
  ),
  RoomSummary(
    id: 'p2',
    name: '새벽 집필반',
    color: 'sky',
    isSystem: true,
    joinType: 'open',
    memberCount: 12,
    isMember: true,
    capacity: 50,
    tags: ['새벽'],
  ),
  RoomSummary(
    id: 'p3',
    name: '웹툰 콘티 모임',
    color: 'violet-deep',
    isSystem: false,
    joinType: 'open',
    memberCount: 3,
    isMember: false,
    capacity: 6,
    tags: ['웹툰'],
  ),
  RoomSummary(
    id: 'p4',
    name: '조용히 쓰는 방',
    color: 'emerald',
    isSystem: false,
    joinType: 'open',
    memberCount: 2,
    isMember: false,
    tags: ['웹소설'],
  ),
];
