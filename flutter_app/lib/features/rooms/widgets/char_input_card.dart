import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/env.dart';
import '../../../core/theme.dart';
import '../../../core/time_util.dart';
import '../../../core/web_api.dart';
import '../../../l10n/app_localizations.dart';

// 글자수(웹툰은 컷수) 기록 — 입력한 만큼 더하는 방식이고, 웹과 같은 서버 로직(recordChars)으로 저장한다.
// (챌린지 달성 확인·활동 기록도 서버가 같이 처리한다.)
class CharInputCard extends StatefulWidget {
  const CharInputCard({
    super.key,
    required this.roomId,
    required this.position,
    required this.todayChars,
    required this.onAdded,
    required this.onActivity,
  });

  final String roomId;
  final String position;
  final int todayChars;
  final ValueChanged<int> onAdded;
  final VoidCallback onActivity;

  @override
  State<CharInputCard> createState() => _CharInputCardState();
}

class _CharInputCardState extends State<CharInputCard> {
  final _controller = TextEditingController();
  final DateTime _mountedAt = DateTime.now();
  bool _busy = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _add() async {
    final l10n = L10n.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final n = int.tryParse(_controller.text.trim());
    if (n == null || n == 0 || _busy) return;
    setState(() => _busy = true);
    if (!Env.preview) {
      // 23시 이후에 시작한 작업은 새벽 1시까지 시작한 날의 기록으로 남긴다(웹과 같은 규칙).
      await WebApi.rpc<Object?>('recordChars', [
        widget.roomId,
        n,
        effectiveRecordDate(_mountedAt),
      ]);
    }
    if (!mounted) return;
    setState(() => _busy = false);
    _controller.clear();
    widget.onAdded(n);
    messenger.showSnackBar(
      SnackBar(
        content: Text(l10n.recordAdded),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final unit = widget.position == 'webtoon' ? l10n.cutUnit : l10n.charUnit;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: pal.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: pal.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.recordToday(widget.todayChars, unit),
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  keyboardType: const TextInputType.numberWithOptions(
                    signed: true,
                  ),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'^-?\d{0,7}')),
                  ],
                  onChanged: (_) => widget.onActivity(),
                  onSubmitted: (_) => _add(),
                  decoration: InputDecoration(
                    hintText: l10n.recordInputHint,
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
                onPressed: _busy ? null : _add,
                style: FilledButton.styleFrom(
                  backgroundColor: pal.lineStrong,
                  foregroundColor: pal.bg,
                ),
                child: Text(l10n.recordAdd),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
