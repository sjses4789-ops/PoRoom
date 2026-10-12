import 'package:flutter/material.dart';

import '../../core/env.dart';
import '../../core/theme.dart';
import '../../core/web_api.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/common.dart';

class NoteItem {
  const NoteItem({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.createdAt,
    required this.read,
    this.roomName,
    this.roomId,
  });

  final String id;
  final String senderId;
  final String senderName;
  final String content;
  final DateTime createdAt;
  final bool read;
  final String? roomName;
  final String? roomId;

  NoteItem asRead() => NoteItem(
        id: id,
        senderId: senderId,
        senderName: senderName,
        content: content,
        createdAt: createdAt,
        read: true,
        roomName: roomName,
        roomId: roomId,
      );
}

Future<List<NoteItem>> fetchInbox() async {
  if (Env.preview) return _preview();
  final json = await WebApi.rpc<Map<String, dynamic>>('getInbox');
  if (json == null) throw Exception('inbox');
  return [
    for (final n in (json['notes'] as List? ?? const []))
      () {
        final m = Map<String, dynamic>.from(n as Map);
        return NoteItem(
          id: m['id'] as String,
          senderId: m['senderId'] as String,
          senderName: m['senderName'] as String? ?? '',
          content: m['content'] as String? ?? '',
          createdAt: DateTime.parse(m['createdAt'] as String),
          read: m['read'] == true,
          roomName: m['roomName'] as String?,
          roomId: m['roomId'] as String?,
        );
      }(),
  ];
}

// 받은 쪽지함 — 목록을 누르면 내용을 보고(읽음 처리), 답장하거나 지울 수 있다.
class NotesPage extends StatefulWidget {
  const NotesPage({super.key});

  @override
  State<NotesPage> createState() => _NotesPageState();
}

class _NotesPageState extends State<NotesPage> {
  Future<List<NoteItem>>? _future;
  List<NoteItem> _notes = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = fetchInbox().then((list) {
      _notes = list;
      return list;
    });
    setState(() {});
  }

  Future<void> _open(NoteItem note) async {
    final l10n = L10n.of(context);
    if (!note.read) {
      setState(() => _notes = [for (final n in _notes) n.id == note.id ? n.asRead() : n]);
      if (!Env.preview) WebApi.rpc<Object?>('markNoteRead', [note.id]);
    }
    final action = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              [note.senderName, if (note.roomName != null) note.roomName!].join(' · '),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(_stamp(note.createdAt), style: TextStyle(fontSize: 11.5, color: ctx.pal.muted)),
            const SizedBox(height: 14),
            SelectableText(note.content, style: const TextStyle(fontSize: 14.5, height: 1.55)),
            const SizedBox(height: 18),
            Row(
              children: [
                FilledButton(onPressed: () => Navigator.pop(ctx, 'reply'), child: Text(l10n.notesReply)),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () => Navigator.pop(ctx, 'delete'),
                  style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFB91C1C)),
                  child: Text(l10n.delete),
                ),
              ],
            ),
          ],
        ),
      ),
    );
    if (!mounted) return;
    if (action == 'reply') {
      await _reply(note);
    } else if (action == 'delete') {
      setState(() => _notes = _notes.where((n) => n.id != note.id).toList());
      if (!Env.preview) await WebApi.rpc<Object?>('deleteNote', [note.id]);
    }
  }

  Future<void> _reply(NoteItem note) async {
    final l10n = L10n.of(context);
    final controller = TextEditingController();
    final text = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.notesReplyTo(note.senderName)),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 5,
          maxLength: 1000,
          decoration: InputDecoration(hintText: l10n.notesPlaceholder),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l10n.cancel)),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text.trim()), child: Text(l10n.notesSend)),
        ],
      ),
    );
    controller.dispose();
    if (text == null || text.isEmpty || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    final result = Env.preview ? {'ok': true} : await WebApi.rpc<Map<String, dynamic>>('sendNote', [note.senderId, note.roomId, text]);
    final failed = result == null || result.containsKey('error');
    messenger.showSnackBar(SnackBar(content: Text(failed ? ((result?['error'] as String?) ?? l10n.loadFailed) : l10n.notesSent)));
  }

  String _stamp(DateTime d) {
    final l = d.toLocal();
    return '${l.year}.${pad2(l.month)}.${pad2(l.day)} ${pad2(l.hour)}:${pad2(l.minute)}';
  }

  static String pad2(int n) => n.toString().padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final pal = context.pal;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.mailbox)),
      body: RefreshIndicator(
        onRefresh: () async => _load(),
        child: AsyncBody<List<NoteItem>>(
          future: _future,
          onRetry: _load,
          builder: (context, _) => _notes.isEmpty
              ? ListView(children: [
                  const SizedBox(height: 120),
                  Center(child: Text(l10n.notesEmpty, style: TextStyle(fontSize: 13, color: pal.muted))),
                ])
              : ListView.separated(
                  itemCount: _notes.length,
                  separatorBuilder: (_, _) => Divider(height: 1, color: pal.line),
                  itemBuilder: (context, i) {
                    final n = _notes[i];
                    return ListTile(
                      onTap: () => _open(n),
                      leading: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(color: n.read ? Colors.transparent : const Color(0xFFF87171), shape: BoxShape.circle),
                      ),
                      title: Text(
                        n.senderName,
                        style: TextStyle(fontSize: 14, fontWeight: n.read ? FontWeight.w500 : FontWeight.w800),
                      ),
                      subtitle: Text(n.content, maxLines: 1, overflow: TextOverflow.ellipsis),
                      trailing: Text(_stamp(n.createdAt).substring(5, 10), style: TextStyle(fontSize: 11, color: pal.muted)),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

List<NoteItem> _preview() {
  final now = DateTime.now();
  return [
    NoteItem(
      id: 'n1',
      senderId: 'u2',
      senderName: '하루',
      content: '오늘 같이 마감 달려요! 10시에 방에서 봐요 :)',
      createdAt: now.subtract(const Duration(hours: 1)),
      read: false,
      roomName: '마감 달리는 방',
    ),
    NoteItem(
      id: 'n2',
      senderId: 'u3',
      senderName: '달빛',
      content: '지난번 공모전 정보 공유 감사했어요.',
      createdAt: now.subtract(const Duration(days: 2)),
      read: true,
    ),
  ];
}
