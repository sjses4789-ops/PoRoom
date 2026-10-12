import 'package:flutter/material.dart';

import '../../../core/pomodoro_controller.dart';
import '../../../core/theme.dart';
import '../../../core/time_util.dart';
import '../../../l10n/app_localizations.dart';
import '../room_data.dart';
import 'donut_ring.dart';

// 방 화면의 뽀모도로 — 큰 도넛에 남은 시간, 시작/일시정지/초기화, 집중·휴식 시간 설정.
// 타이머는 앱 전체에서 하나(PomodoroController)이고, 다른 방에서 돌고 있으면 이 방에서는 대기 상태로 보인다.
class PomodoroCard extends StatelessWidget {
  const PomodoroCard({super.key, required this.room});

  final RoomInfo room;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final pomo = PomodoroScope.of(context);
    final active = pomo.isActiveRoom(room.id);
    final phase = active ? pomo.phase : PomodoroPhase.idle;
    final running = active && pomo.running;
    final started = active && pomo.started;
    final remaining = active ? pomo.remainingSeconds : pomo.focusMinutes * 60;
    final fraction = active ? pomo.elapsedFraction : 0.0;
    final color = phase == PomodoroPhase.rest ? kBreakBlue : kBrand;
    final phaseLabel = switch (phase) {
      PomodoroPhase.focus => l10n.phaseFocus,
      PomodoroPhase.rest => l10n.phaseBreak,
      PomodoroPhase.idle => l10n.phaseIdle,
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: pal.surface,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: pal.muted),
      ),
      child: Column(
        children: [
          DonutRing(
            progress: fraction,
            color: color,
            size: 168,
            strokeWidth: 12,
            trackColor: pal.line,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  formatClock(remaining),
                  style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w800, fontFeatures: [FontFeature.tabularFigures()]),
                ),
                const SizedBox(height: 2),
                Text(
                  started ? '$phaseLabel · ${l10n.pomodoroSessions(pomo.focusSessionCount)}' : phaseLabel,
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: started ? color : pal.muted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FilledButton(
                onPressed: () {
                  if (running) {
                    pomo.pause();
                  } else {
                    pomo.start(ActiveRoom(id: room.id, name: room.name));
                  }
                },
                child: Text(running
                    ? l10n.pomodoroPause
                    : started
                        ? l10n.pomodoroResume
                        : l10n.pomodoroStart),
              ),
              const SizedBox(width: 10),
              OutlinedButton(
                onPressed: started ? pomo.reset : null,
                child: Text(l10n.pomodoroReset),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _Stepper(
                label: l10n.pomodoroFocusLabel,
                value: pomo.focusMinutes,
                unit: l10n.minuteUnit,
                enabled: !started,
                onChanged: pomo.setFocusMinutes,
                step: 5,
              ),
              const SizedBox(width: 18),
              _Stepper(
                label: l10n.pomodoroBreakLabel,
                value: pomo.breakMinutes,
                unit: l10n.minuteUnit,
                enabled: !started,
                onChanged: pomo.setBreakMinutes,
                step: 1,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stepper extends StatelessWidget {
  const _Stepper({
    required this.label,
    required this.value,
    required this.unit,
    required this.enabled,
    required this.onChanged,
    required this.step,
  });

  final String label;
  final int value;
  final String unit;
  final bool enabled;
  final ValueChanged<int> onChanged;
  final int step;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: pal.muted)),
        const SizedBox(width: 6),
        _RoundBtn(icon: Icons.remove, onTap: enabled ? () => onChanged(value - step) : null),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text('$value$unit', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        ),
        _RoundBtn(icon: Icons.add, onTap: enabled ? () => onChanged(value + step) : null),
      ],
    );
  }
}

class _RoundBtn extends StatelessWidget {
  const _RoundBtn({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    return InkResponse(
      onTap: onTap,
      radius: 18,
      child: Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: onTap == null ? pal.line : pal.muted)),
        child: Icon(icon, size: 14, color: onTap == null ? pal.line : pal.subtext),
      ),
    );
  }
}
