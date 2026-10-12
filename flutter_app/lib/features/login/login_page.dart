import 'package:flutter/material.dart';

import '../../core/auth_controller.dart';
import '../../core/theme.dart';
import '../../l10n/app_localizations.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool _busy = false;
  String? _error;

  Future<void> _signIn() async {
    final l10n = L10n.of(context);
    setState(() {
      _busy = true;
      _error = null;
    });
    final message = await AuthScope.of(context).signInWithGoogle();
    if (!mounted) return;
    setState(() {
      _busy = false;
      _error = message == null ? null : l10n.loginFailed;
    });
  }

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final l10n = L10n.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.asset('assets/images/icon.png', width: 104, height: 104),
                ),
                const SizedBox(height: 16),
                const Text('PoRoom', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(
                  l10n.loginSubtitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, height: 1.5, color: pal.subtext),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: 260,
                  height: 48,
                  child: FilledButton(
                    onPressed: _busy ? null : _signIn,
                    child: _busy
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(l10n.loginGoogle, style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13)),
                ],
                const SizedBox(height: 14),
                Text(l10n.loginNote, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: pal.muted)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
