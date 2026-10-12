import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

// 이 기기(앱 설치)를 구분하는 값 — 웹의 browserId와 같은 용도다. 같은 계정이 다른 브라우저/기기에서 같은 방에
// 동시에 접속했는지 알아보는 데 쓴다(웹의 중복 접속 안내와 같은 규칙).
class BrowserId {
  const BrowserId._();

  static const _key = 'poroom:browser-id';
  static String _value = '';

  static String get value => _value;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    var id = prefs.getString(_key);
    if (id == null || id.isEmpty) {
      id = _random();
      await prefs.setString(_key, id);
    }
    _value = id;
  }

  static String _random() {
    final rng = Random.secure();
    return List.generate(16, (_) => rng.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
  }

  // 접속(화면) 하나를 구분하는 값.
  static String newSessionId() => _random();
}
