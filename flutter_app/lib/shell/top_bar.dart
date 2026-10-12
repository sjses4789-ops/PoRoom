import 'dart:async';

import 'package:flutter/material.dart';

import '../core/auth_controller.dart';
import '../core/env.dart';
import '../core/theme.dart';
import '../core/web_api.dart';
import '../features/me/me_page.dart';
import '../features/notes/notes_page.dart';
import '../l10n/app_localizations.dart';
import '../widgets/character_avatar.dart';
import '../widgets/login_gate.dart';

// 상단 바: 왼쪽에 로고, 오른쪽에 우편함 아이콘(안 읽은 쪽지 수 뱃지)과 프로필 사진(누르면 [개인] 화면).
// 우편함/닉네임 위치는 아직 확정 전이라 여기 한 곳만 고치면 바뀐다.
class AppTopBar extends StatelessWidget {
  const AppTopBar({super.key});

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    final auth = AuthScope.of(context);

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
      decoration: BoxDecoration(
        color: pal.bg,
        border: Border(bottom: BorderSide(color: pal.line)),
      ),
      child: Row(
        children: [
          // 로고(앱에서는 BETA 표시를 쓰지 않는다 — 웹의 BETA 표시는 앱 출시 때 함께 없앨 예정).
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset('assets/images/icon.png', width: 28, height: 28),
              const SizedBox(width: 8),
              Text(
                l10n.appTitle,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  color: kBrand,
                ),
              ),
            ],
          ),
          const Spacer(),
          if (auth.isGuest)
            FilledButton(
              onPressed: () => openLogin(context),
              style: FilledButton.styleFrom(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              child: Text(
                l10n.guestLoginButton,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            )
          else ...[
            const _MailButton(),
            const SizedBox(width: 2),
            InkWell(
              borderRadius: BorderRadius.circular(99),
              onTap: () =>
                  Navigator.of(context)
                      .push(MaterialPageRoute(builder: (_) => const MePage())),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CharacterAvatar(
                      characterId: auth.profile?.characterId,
                      size: 34,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// 우편함 아이콘 — 안 읽은 쪽지 수를 뱃지로 보여 준다(1분마다 다시 확인).
class _MailButton extends StatefulWidget {
  const _MailButton();

  @override
  State<_MailButton> createState() => _MailButtonState();
}

class _MailButtonState extends State<_MailButton> {
  int _unread = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (Env.preview) {
      _unread = 1;
      return;
    }
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final n = await WebApi.rpc<int>('getUnreadNoteCount');
    if (mounted && n != null) setState(() => _unread = n);
  }

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          tooltip: l10n.mailbox,
          onPressed: () async {
            await Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const NotesPage()));
            _refresh();
          },
          icon: Icon(Icons.mail_outline_rounded, color: pal.subtext),
        ),
        if (_unread > 0)
          Positioned(
            right: 4,
            top: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              constraints: const BoxConstraints(minWidth: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF87171),
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                _unread > 9 ? '9+' : '$_unread',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
