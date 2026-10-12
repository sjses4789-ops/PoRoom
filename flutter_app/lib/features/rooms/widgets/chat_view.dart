import 'package:flutter/material.dart';

import '../../../core/chat_colors.dart';
import '../../../core/theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../widgets/character_avatar.dart';
import '../room_chat.dart';
import '../room_data.dart';

// 웹 채팅 패널과 같은 동작 — 내 말은 오른쪽, 다른 사람 말은 왼쪽 말풍선. 고른 말풍선 색이 프로필 사진 테두리색이
// 된다. 내 메시지는(방장/부방장은 모든 메시지를) 길게 눌러 삭제할 수 있다.
class ChatView extends StatefulWidget {
  const ChatView({
    super.key,
    required this.chat,
    required this.members,
    required this.selfId,
    required this.canModerate,
    required this.onTyping,
  });

  final RoomChatController chat;
  final List<RoomMember> members;
  final String selfId;
  final bool canModerate;
  final VoidCallback onTyping;

  @override
  State<ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends State<ChatView> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  bool _sending = false;
  int _lastCount = 0;

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    final ok = await widget.chat.send(text);
    if (!mounted) return;
    setState(() => _sending = false);
    if (ok) _controller.clear();
  }

  Future<void> _confirmDelete(String id) async {
    final l10n = L10n.of(context);
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.chatDeleteTitle),
        content: Text(l10n.chatDeleteBody),
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
    if (yes == true) widget.chat.remove(id);
  }

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    return ListenableBuilder(
      listenable: widget.chat,
      builder: (context, _) {
        final messages = widget.chat.messages;
        final byId = {for (final m in widget.members) m.id: m};
        if (messages.length != _lastCount) {
          _lastCount = messages.length;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scroll.hasClients)
              _scroll.animateTo(
                _scroll.position.maxScrollExtent,
                duration: const Duration(milliseconds: 150),
                curve: Curves.easeOut,
              );
          });
        }
        return Column(
          children: [
            Expanded(
              child: messages.isEmpty
                  ? Center(
                      child: Text(
                        l10n.chatEmpty,
                        style: TextStyle(fontSize: 13, color: pal.muted),
                      ),
                    )
                  : ListView.separated(
                      controller: _scroll,
                      padding: const EdgeInsets.all(12),
                      itemCount: messages.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, i) {
                        final m = messages[i];
                        final mine = m.userId == widget.selfId;
                        final sender = byId[m.userId];
                        final color = chatColorFor(sender?.chatColor);
                        final canDelete = mine || widget.canModerate;
                        return GestureDetector(
                          onLongPress: canDelete
                              ? () => _confirmDelete(m.id)
                              : null,
                          child: Row(
                            mainAxisAlignment: mine
                                ? MainAxisAlignment.end
                                : MainAxisAlignment.start,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            textDirection: mine
                                ? TextDirection.rtl
                                : TextDirection.ltr,
                            children: [
                              CharacterAvatar(
                                characterId: sender?.characterId,
                                size: 30,
                                borderColor: color?.border,
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Column(
                                  crossAxisAlignment: mine
                                      ? CrossAxisAlignment.end
                                      : CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${mine ? l10n.selfLabel : (sender?.name ?? l10n.unknownUser)}'
                                      '${m.targetUserId != null ? '  🤫 ${l10n.whisperTag}' : ''}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: pal.muted,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 8,
                                      ),
                                      decoration: BoxDecoration(
                                        // 색을 안 골랐으면 웹처럼 내 말풍선은 어둡게, 남의 말풍선은 연한 회색.
                                        color:
                                            color?.bubble ??
                                            (mine
                                                ? const Color(0xFF171717)
                                                : const Color(0xFFF5F5F5)),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        m.content,
                                        textDirection: TextDirection.ltr,
                                        style: TextStyle(
                                          fontSize: 14,
                                          height: 1.4,
                                          color:
                                              color?.text ??
                                              (mine
                                                  ? Colors.white
                                                  : const Color(0xFF262626)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              decoration: BoxDecoration(
                color: pal.bg,
                border: Border(top: BorderSide(color: pal.line)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      enabled: !_sending,
                      maxLength: 1000,
                      onChanged: (_) => widget.onTyping(),
                      onSubmitted: (_) => _submit(),
                      textInputAction: TextInputAction.send,
                      decoration: InputDecoration(
                        hintText: l10n.chatInputHint,
                        counterText: '',
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: pal.line),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: pal.line),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _sending ? null : _submit,
                    style: FilledButton.styleFrom(
                      backgroundColor: pal.lineStrong,
                      foregroundColor: pal.bg,
                    ),
                    child: Text(l10n.chatSend),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
