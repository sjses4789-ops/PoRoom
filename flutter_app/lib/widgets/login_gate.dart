import 'package:flutter/material.dart';

import '../core/auth_controller.dart';
import '../features/login/login_page.dart';
import '../l10n/app_localizations.dart';

// 로그인이 필요한 동작(글쓰기·반응·방 입장·참여 등) 앞에서 부른다. 로그인돼 있으면 true, 아니면 안내창을 띄워
// 로그인 화면으로 보내고 false를 돌려준다(보기 전용 상태에서는 화면만 둘러볼 수 있다).
Future<bool> requireLogin(BuildContext context) async {
  final auth = AuthScope.of(context);
  if (!auth.isGuest) return true;
  final l10n = L10n.of(context);
  final yes = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l10n.loginRequiredTitle),
      content: Text(l10n.loginRequiredBody),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(l10n.cancel),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(l10n.guestLoginButton),
        ),
      ],
    ),
  );
  if (yes == true && context.mounted) openLogin(context);
  return false;
}

void openLogin(BuildContext context) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(builder: (_) => const LoginPage(dismissible: true)),
  );
}
