import 'package:flutter/material.dart';

import '../../../core/env.dart';
import '../../../core/pomodoro_controller.dart';
import '../../../core/theme.dart';
import '../../../l10n/app_localizations.dart';
import '../room_presence.dart';
import 'donut_ring.dart';

class ParticipantData {
  const ParticipantData({
    required this.id,
    required this.name,
    required this.isSelf,
    required this.phase,
    required this.elapsedFraction,
    required this.presence,
    required this.recordsVisible,
    required this.todayChars,
    required this.position,
    required this.isOwner,
    required this.isVice,
    this.characterId,
    this.workStatus,
    this.lastSeenAt,
  });

  final String id;
  final String name;
  final bool isSelf;
  final String? characterId;
  final PomodoroPhase phase;
  final double elapsedFraction;
  final PresenceStatus presence;
  final bool recordsVisible;
  final int todayChars;
  final String position;
  final String? workStatus;
  final bool isOwner;
  final bool isVice;
  final DateTime? lastSeenAt;
}

// 웹 work-status-colors.ts와 같은 은은한 파스텔 배경(저장된 상태 문구가 한국어일 때만 매칭된다).
const Map<String, Color> _statusBg = {
  '구상중': Color(0xFFEEF1F4),
  '집필중': Color(0xFFEEF3EE),
  '퇴고중': Color(0xFFF5F2EA),
  '교정중': Color(0xFFF5EFEA),
  '자료조사': Color(0xFFF1EEF5),
  '휴식 중': Color(0xFFEAF2F1),
  '자리 비움': Color(0xFFF0F0EE),
  '구상 중': Color(0xFFEEF1F4),
  '자료 조사': Color(0xFFF1EEF5),
  '콘티': Color(0xFFEFEFF6),
  '배경': Color(0xFFEAF0EC),
  '스케치': Color(0xFFF2F0EA),
  '펜터치': Color(0xFFF0EFEA),
  '채색': Color(0xFFF5EAEE),
  '후편집': Color(0xFFEAEEF5),
  '마무리': Color(0xFFEEF3EE),
};

Color _phaseColor(PomodoroPhase p) => switch (p) {
      PomodoroPhase.focus => kBrand,
      PomodoroPhase.rest => kBreakBlue,
      PomodoroPhase.idle => const Color(0xFF8A8A8A),
    };

class ParticipantCard extends StatelessWidget {
  const ParticipantCard({super.key, required this.data});

  final ParticipantData data;

  String _relative(L10n l10n, DateTime? at) {
    if (at == null) return l10n.neverSeen;
    final minutes = DateTime.now().difference(at).inMinutes;
    final label = minutes < 1
        ? l10n.justNow
        : minutes < 60
            ? l10n.minutesAgo(minutes)
            : minutes < 60 * 24
                ? l10n.hoursAgo(minutes ~/ 60)
                : l10n.daysAgo(minutes ~/ (60 * 24));
    return l10n.lastSeen(label);
  }

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final offline = data.presence == PresenceStatus.offline;
    final statusBg = data.workStatus == null ? null : _statusBg[data.workStatus];
    final onPastel = statusBg != null;
    final primary = onPastel ? const Color(0xFF171717) : pal.text;
    final secondary = onPastel ? const Color(0xFF525252) : pal.muted;
    final color = _phaseColor(data.phase);
    final unit = data.position == 'webtoon' ? l10n.cutUnit : l10n.charUnit;
    final phaseLabel = switch (data.phase) {
      PomodoroPhase.focus => l10n.phaseFocus,
      PomodoroPhase.rest => l10n.phaseBreak,
      PomodoroPhase.idle => l10n.phaseIdle,
    };

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: statusBg ?? pal.surface,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: data.isSelf ? pal.lineStrong : pal.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 4 / 3,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(color: const Color(0xFFFAFAFA)),
                  if (data.characterId != null)
                    ColorFiltered(
                      colorFilter: offline
                          ? const ColorFilter.mode(Colors.grey, BlendMode.saturation)
                          : const ColorFilter.mode(Colors.transparent, BlendMode.dst),
                      child: Image.network(
                        '${Env.webUrl}/characters/${data.characterId}.png',
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const Center(child: Text('🙂', style: TextStyle(fontSize: 28))),
                      ),
                    )
                  else
                    const Center(child: Text('🙂', style: TextStyle(fontSize: 28))),
                  Positioned(
                    left: 4,
                    top: 4,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(color: Color(0xE6FFFFFF), shape: BoxShape.circle),
                      child: DonutRing(
                        progress: offline ? 0 : data.elapsedFraction,
                        color: offline ? const Color(0xFFD4D4D4) : color,
                        size: 34,
                        strokeWidth: 6,
                      ),
                    ),
                  ),
                  if (data.isOwner || data.isVice)
                    Positioned(
                      right: 4,
                      top: 4,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: Color(0xE6FFFFFF), shape: BoxShape.circle),
                        child: Icon(Icons.workspace_premium_rounded,
                            size: data.isOwner ? 16 : 13,
                            color: data.isOwner ? const Color(0xFFF2B705) : const Color(0xFFF472B6)),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  data.isSelf ? '${data.name} (${l10n.selfLabel})' : data.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: primary),
                ),
              ),
              if (data.workStatus != null && !offline) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: pal.line),
                  ),
                  child: Text(data.workStatus!, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: secondary)),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                data.recordsVisible ? '${_fmt(data.todayChars)}$unit' : l10n.recordsPrivate,
                style: TextStyle(fontSize: 11.5, color: secondary),
              ),
              if (offline)
                Flexible(
                  child: Text(
                    _relative(l10n, data.lastSeenAt),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: secondary),
                  ),
                )
              else
                Text(phaseLabel, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: color)),
            ],
          ),
        ],
      ),
    );
  }
}

String _fmt(int n) {
  final s = n.toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return b.toString();
}
