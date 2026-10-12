import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'core/auth_controller.dart';
import 'core/browser_id.dart';
import 'core/env.dart';
import 'core/pomodoro_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!Env.preview && !Env.hasBackend) {
    runApp(const _ConfigError());
    return;
  }
  if (!Env.preview) {
    await Supabase.initialize(url: Env.supabaseUrl, publishableKey: Env.supabaseAnonKey);
  }

  await BrowserId.init();
  final auth = AuthController();
  await auth.init();
  runApp(PoRoomApp(auth: auth, pomodoro: PomodoroController()));
}

// 개발 중 env.json 없이 실행했을 때 안내만 띄운다.
class _ConfigError extends StatelessWidget {
  const _ConfigError();

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'SUPABASE_URL / SUPABASE_ANON_KEY 가 없어요.\n'
              'node tool/gen_env.mjs 로 env.json 을 만든 뒤\n'
              'flutter run --dart-define-from-file=env.json 으로 실행해 주세요.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
