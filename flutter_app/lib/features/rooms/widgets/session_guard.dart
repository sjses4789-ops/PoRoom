import 'package:flutter/material.dart';

import '../../../core/theme.dart';
import '../../../l10n/app_localizations.dart';

// 같은 계정이 다른 브라우저/기기에서 같은 방에 동시에 접속하는 경우를 막는 안내(웹의 SessionGuardDialog와 같은 규칙).
//  - 내가 나중에 들어온 쪽: "이 화면에서 계속"을 고르면 먼저 접속해 있던 쪽이 밀려난다.
//  - 내가 먼저 접속해 있었는데 다른 곳에서 이어받은 쪽: 이 화면은 더 쓸 수 없다.
class SessionGuard extends StatelessWidget {
  const SessionGuard({
    super.key,
    required this.takenOver,
    required this.onContinue,
    required this.onLeave,
  });

  final bool takenOver;
  final VoidCallback onContinue;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    return Positioned.fill(
      child: Container(
        color: const Color(0x99171717),
        alignment: Alignment.center,
        padding: const EdgeInsets.all(24),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 380),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: pal.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: pal.line),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '⚠️ ${takenOver ? l10n.sessionGuardTakenOverTitle : l10n.sessionGuardDuplicateTitle}',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                takenOver
                    ? l10n.sessionGuardTakenOverBody
                    : l10n.sessionGuardDuplicateBody,
                style: TextStyle(
                  fontSize: 13.5,
                  height: 1.5,
                  color: pal.subtext,
                ),
              ),
              if (!takenOver) ...[
                const SizedBox(height: 8),
                Text(
                  l10n.sessionGuardContinueHint,
                  style: TextStyle(fontSize: 12, color: pal.muted),
                ),
              ],
              const SizedBox(height: 16),
              if (!takenOver)
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: onContinue,
                    child: Text(l10n.sessionGuardContinueHere),
                  ),
                ),
              if (!takenOver) const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onLeave,
                  child: Text(
                    takenOver ? l10n.sessionGuardOk : l10n.sessionGuardLeave,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
