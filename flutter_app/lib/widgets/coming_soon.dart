import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/env.dart';
import '../core/theme.dart';
import '../l10n/app_localizations.dart';

// 아직 앱에 만들어지지 않은 화면의 자리 — 웹의 같은 화면으로 바로 갈 수 있게 한다.
class ComingSoon extends StatelessWidget {
  const ComingSoon({super.key, required this.webPath});

  final String webPath;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(l10n.comingSoon, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              l10n.comingSoonBody,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13.5, height: 1.5, color: pal.subtext),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => launchUrl(Uri.parse('${Env.webUrl}$webPath'), mode: LaunchMode.externalApplication),
              child: Text(l10n.openOnWeb),
            ),
          ],
        ),
      ),
    );
  }
}
