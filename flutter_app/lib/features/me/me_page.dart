import 'package:flutter/material.dart';

import '../../core/auth_controller.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/character_avatar.dart';
import '../../widgets/coming_soon.dart';

class MePage extends StatelessWidget {
  const MePage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = L10n.of(context);
    final auth = AuthScope.of(context);
    final profile = auth.profile;
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          CharacterAvatar(characterId: profile?.characterId, size: 28),
          const SizedBox(width: 8),
          Text(profile?.name ?? l10n.myPage),
        ]),
        actions: [
          TextButton(
            onPressed: () async {
              await auth.signOut();
              if (context.mounted) Navigator.of(context).popUntil((r) => r.isFirst);
            },
            child: Text(l10n.signOut),
          ),
        ],
      ),
      body: const ComingSoon(webPath: '/me'),
    );
  }
}
