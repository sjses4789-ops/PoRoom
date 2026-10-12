import 'package:flutter/material.dart';

import 'core/auth_controller.dart';
import 'core/pomodoro_controller.dart';
import 'core/theme.dart';
import 'features/login/login_page.dart';
import 'features/login/profile_incomplete_page.dart';
import 'l10n/app_localizations.dart';
import 'shell/app_shell.dart';

class PoRoomApp extends StatelessWidget {
  const PoRoomApp({super.key, required this.auth, required this.pomodoro});

  final AuthController auth;
  final PomodoroController pomodoro;

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      controller: auth,
      // 뽀모도로는 앱 전체에서 하나 — 방 화면을 나가거나 탭을 오가도 계속 흘러간다.
      child: PomodoroScope(
        controller: pomodoro,
        child: MaterialApp(
          onGenerateTitle: (context) => L10n.of(context).appTitle,
          debugShowCheckedModeBanner: false,
          theme: buildTheme(Brightness.light),
          darkTheme: buildTheme(Brightness.dark),
          localizationsDelegates: L10n.localizationsDelegates,
          supportedLocales: L10n.supportedLocales,
          home: ListenableBuilder(
            listenable: auth,
            builder: (context, _) {
              switch (auth.status) {
                case AuthStatus.loading:
                  return const Scaffold(body: Center(child: CircularProgressIndicator()));
                case AuthStatus.signedOut:
                  return const LoginPage();
                case AuthStatus.signedIn:
                  if (auth.profile?.isBanned ?? false) return const LoginPage();
                  if (!(auth.profile?.isComplete ?? false)) return const ProfileIncompletePage();
                  return const AppShell();
              }
            },
          ),
        ),
      ),
    );
  }
}
