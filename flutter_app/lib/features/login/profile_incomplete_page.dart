import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_controller.dart';
import '../../core/env.dart';
import '../../core/theme.dart';
import '../../l10n/app_localizations.dart';

// 닉네임/직업을 아직 안 정한(처음 가입한) 사용자 — 웹 온보딩에서 정한 뒤 돌아오게 한다.
class ProfileIncompletePage extends StatelessWidget {
  const ProfileIncompletePage({super.key});

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final auth = AuthScope.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  l10n.profileIncompleteTitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  l10n.profileIncompleteBody,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13.5,
                    height: 1.5,
                    color: pal.subtext,
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => launchUrl(
                    Uri.parse('${Env.webUrl}/onboarding'),
                    mode: LaunchMode.externalApplication,
                  ),
                  child: Text(l10n.profileIncompleteButton),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: auth.reloadProfile,
                  child: Text(l10n.retry),
                ),
                TextButton(onPressed: auth.signOut, child: Text(l10n.signOut)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
