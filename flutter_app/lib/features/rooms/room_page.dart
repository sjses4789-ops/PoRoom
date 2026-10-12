import 'package:flutter/material.dart';

import '../../widgets/coming_soon.dart';
import 'room_models.dart';

class RoomPage extends StatelessWidget {
  const RoomPage({super.key, required this.room});

  final RoomSummary room;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(room.name)),
      body: ComingSoon(webPath: '/room/${room.id}'),
    );
  }
}
