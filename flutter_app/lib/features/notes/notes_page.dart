import 'package:flutter/material.dart';

import '../../l10n/app_localizations.dart';
import '../../widgets/coming_soon.dart';

class NotesPage extends StatelessWidget {
  const NotesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(L10n.of(context).mailbox)),
      body: const ComingSoon(webPath: '/main'),
    );
  }
}
