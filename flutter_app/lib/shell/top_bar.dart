import 'package:flutter/material.dart';

import '../core/auth_controller.dart';
import '../core/theme.dart';
import '../features/me/me_page.dart';
import '../features/notes/notes_page.dart';
import '../l10n/app_localizations.dart';
import '../widgets/character_avatar.dart';

// 상단 바: 왼쪽에 로고(+BETA), 오른쪽에 우편함 아이콘과 닉네임(누르면 [개인] 화면).
// 우편함/닉네임 위치는 아직 확정 전이라 여기 한 곳만 고치면 바뀐다.
class AppTopBar extends StatelessWidget {
  const AppTopBar({super.key});

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final auth = AuthScope.of(context);
    final name = auth.profile?.name ?? '';

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
      decoration: BoxDecoration(
        color: pal.bg,
        border: Border(bottom: BorderSide(color: pal.line)),
      ),
      child: Row(
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset('assets/images/icon.png', width: 22, height: 22),
                  const SizedBox(width: 6),
                  Text(
                    l10n.appTitle,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: -0.2),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: const Text(
                  'BETA',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFFB45309)),
                ),
              ),
            ],
          ),
          const Spacer(),
          IconButton(
            tooltip: l10n.mailbox,
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotesPage())),
            icon: Icon(Icons.mail_outline_rounded, color: pal.subtext),
          ),
          const SizedBox(width: 2),
          InkWell(
            borderRadius: BorderRadius.circular(99),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MePage())),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CharacterAvatar(characterId: auth.profile?.characterId, size: 26),
                  const SizedBox(width: 6),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 110),
                    child: Text(
                      name.isEmpty ? l10n.myPage : name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
