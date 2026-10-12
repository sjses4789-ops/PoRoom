import 'package:flutter/material.dart';

import '../../widgets/coming_soon.dart';

class FeedPage extends StatelessWidget {
  const FeedPage({super.key});

  @override
  Widget build(BuildContext context) => const ComingSoon(webPath: '/feed');
}
