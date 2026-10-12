import 'package:flutter/widgets.dart';

import 'bottom_bar.dart';

// 홈 화면 같은 곳에서 하단 탭을 바꾸게 해 주는 통로(예: "피드로 이동", "챌린지 자세히 보기").
class ShellNav extends InheritedWidget {
  const ShellNav({super.key, required this.goTo, required super.child});

  final void Function(AppTab tab) goTo;

  static ShellNav? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ShellNav>();

  @override
  bool updateShouldNotify(ShellNav oldWidget) => false;
}
