import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/env.dart';

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.userId,
    required this.content,
    required this.createdAt,
    this.targetUserId,
  });

  final String id;
  final String userId;
  final String content;
  final String createdAt;
  final String? targetUserId;

  static ChatMessage fromRow(Map<String, dynamic> r) => ChatMessage(
    id: r['id'] as String,
    userId: r['user_id'] as String,
    content: r['content'] as String,
    createdAt: r['created_at'] as String,
    targetUserId: r['target_user_id'] as String?,
  );
}

// 웹(chat-panel.tsx)과 같은 방식 — 최근 50개는 DB에서 읽고, 새 메시지는 방 채널(room-chat:방id)의 broadcast로
// 실시간 전달한다. 귓속말은 받는 사람 전용 채널(whisper-inbox:방id:사용자id)로 따로 온다.
// 실시간 신호는 방 참여자 누구나 보낼 수 있어 내용을 믿을 수 없으므로(웹과 같은 이유), 신호에는 메시지 id만
// 실려 오고 DB(RLS로 보호됨)에서 그 메시지를 직접 읽어 확인한 것만 화면에 반영한다.
class RoomChatController extends ChangeNotifier {
  RoomChatController({
    required this.roomId,
    required this.selfId,
    this.onIncoming,
  }) {
    if (Env.preview) {
      messages = _previewMessages(selfId);
      return;
    }
    _load();
    _connect();
  }

  final String roomId;
  final String selfId;
  final void Function()? onIncoming;

  List<ChatMessage> messages = const [];
  RealtimeChannel? _room;
  RealtimeChannel? _inbox;
  bool _disposed = false;

  SupabaseClient get _client => Supabase.instance.client;

  static const _cols = 'id,user_id,content,created_at,target_user_id';

  Future<void> _load() async {
    try {
      final rows = await _client
          .from('chat_messages')
          .select(_cols)
          .eq('room_id', roomId)
          .order('created_at', ascending: false)
          .limit(50);
      final initial = [for (final r in rows.reversed) ChatMessage.fromRow(r)];
      // 불러오는 동안 이미 실시간으로 받은 메시지는 보존하며 합친다.
      final seen = initial.map((m) => m.id).toSet();
      messages = [...initial, ...messages.where((m) => !seen.contains(m.id))];
      _notify();
    } catch (_) {}
  }

  void _connect() {
    final room = _client.channel(
      'room-chat:$roomId',
      opts: const RealtimeChannelConfig(private: true),
    );
    room
      ..onBroadcast(
        event: 'message',
        callback: (p) => _accept(p).then((m) {
          if (m != null && m.userId != selfId) onIncoming?.call();
        }),
      )
      ..onBroadcast(event: 'delete', callback: (p) => _confirmDeleted(p))
      ..onBroadcast(event: 'clear', callback: (_) => _reloadAfterClear())
      ..subscribe();
    _room = room;

    final inbox = _client.channel(
      'whisper-inbox:$roomId:$selfId',
      opts: const RealtimeChannelConfig(private: true),
    );
    inbox
      ..onBroadcast(
        event: 'whisper',
        callback: (p) => _accept(p).then((m) {
          if (m != null) onIncoming?.call();
        }),
      )
      ..subscribe();
    _inbox = inbox;
  }

  String? _idOf(Map<String, dynamic> raw) {
    final inner = raw['payload'];
    final map = inner is Map ? inner : raw;
    final id = map['id'];
    return id is String ? id : null;
  }

  Future<ChatMessage?> _accept(Map<String, dynamic> raw) async {
    final id = _idOf(raw);
    if (id == null || messages.any((m) => m.id == id)) return null;
    try {
      final row = await _client
          .from('chat_messages')
          .select(_cols)
          .eq('id', id)
          .maybeSingle();
      if (row == null) return null; // DB에 없는 메시지 — 위조된 신호이거나 내가 볼 수 없는 메시지다.
      final msg = ChatMessage.fromRow(row);
      if (messages.any((m) => m.id == msg.id)) return null;
      messages = [...messages, msg];
      _notify();
      return msg;
    } catch (_) {
      return null;
    }
  }

  Future<void> _confirmDeleted(Map<String, dynamic> raw) async {
    final id = _idOf(raw);
    if (id == null) return;
    try {
      final row = await _client
          .from('chat_messages')
          .select('id')
          .eq('id', id)
          .maybeSingle();
      if (row == null) {
        messages = messages.where((m) => m.id != id).toList();
        _notify();
      }
    } catch (_) {}
  }

  Future<void> _reloadAfterClear() async {
    try {
      final rows = await _client
          .from('chat_messages')
          .select(_cols)
          .eq('room_id', roomId)
          .order('created_at', ascending: false)
          .limit(50);
      messages = [for (final r in rows.reversed) ChatMessage.fromRow(r)];
      _notify();
    } catch (_) {}
  }

  Future<bool> send(String content) async {
    final text = content.trim();
    if (text.isEmpty) return false;
    if (Env.preview) {
      messages = [
        ...messages,
        ChatMessage(
          id: 'm${messages.length}',
          userId: selfId,
          content: text,
          createdAt: DateTime.now().toIso8601String(),
        ),
      ];
      _notify();
      return true;
    }
    try {
      final row = await _client
          .from('chat_messages')
          .insert({
            'room_id': roomId,
            'user_id': selfId,
            'content': text,
            'target_user_id': null,
          })
          .select(_cols)
          .single();
      final msg = ChatMessage.fromRow(row);
      if (!messages.any((m) => m.id == msg.id)) messages = [...messages, msg];
      _notify();
      await _room?.sendBroadcastMessage(
        event: 'message',
        payload: {'id': msg.id},
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> remove(String id) async {
    messages = messages.where((m) => m.id != id).toList();
    _notify();
    if (Env.preview) return;
    try {
      await _client.from('chat_messages').delete().eq('id', id);
      await _room?.sendBroadcastMessage(event: 'delete', payload: {'id': id});
    } catch (_) {}
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    final room = _room;
    final inbox = _inbox;
    if (room != null) _client.removeChannel(room);
    if (inbox != null) _client.removeChannel(inbox);
    super.dispose();
  }
}

List<ChatMessage> _previewMessages(String selfId) {
  final now = DateTime.now();
  String t(int minutesAgo) =>
      now.subtract(Duration(minutes: minutesAgo)).toIso8601String();
  return [
    ChatMessage(
      id: 'm1',
      userId: 'u2',
      content: '오늘 마감 가즈아! 다들 화이팅 💪',
      createdAt: t(12),
    ),
    ChatMessage(
      id: 'm2',
      userId: selfId,
      content: '저는 3천자 목표예요. 커피 한잔하고 시작합니다 ☕',
      createdAt: t(10),
    ),
    ChatMessage(
      id: 'm3',
      userId: 'u3',
      content: '콘티 한 컷만 더 그리고 휴식!',
      createdAt: t(4),
    ),
    ChatMessage(
      id: 'm4',
      userId: 'u2',
      content: '25분 집중 끝나면 같이 쉬어요',
      createdAt: t(1),
    ),
  ];
}
