import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import 'env.dart';

// 웹의 서버 액션(src/lib/*.ts)을 앱이 그대로 부르는 통로(/api/app/rpc) — 웹과 같은 규칙·같은 검증을 거친다.
// 허용된 함수 이름 목록은 서버(src/app/api/app/rpc/route.ts)에 있다. 로그인 토큰을 Bearer로 보낸다.
class WebApi {
  const WebApi._();

  static Future<T?> rpc<T>(String fn, [List<Object?> args = const []]) async {
    final token = Supabase.instance.client.auth.currentSession?.accessToken;
    if (token == null) return null;
    try {
      final res = await http.post(
        Uri.parse('${Env.webUrl}/api/app/rpc'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'fn': fn, 'args': args}),
      );
      if (res.statusCode != 200) return null;
      final json = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
      if (json['ok'] != true) return null;
      return json['result'] as T?;
    } catch (_) {
      return null;
    }
  }

  // 서버가 집계해서 돌려주는 읽기 전용 데이터(/api/app/<path>) — 랭킹처럼 전체 기록이 필요한 화면에 쓴다.
  static Future<Map<String, dynamic>?> getJson(String path, [Map<String, String>? query]) async {
    final token = Supabase.instance.client.auth.currentSession?.accessToken;
    try {
      final res = await http.get(
        Uri.parse('${Env.webUrl}/api/app/$path').replace(queryParameters: query),
        headers: {if (token != null) 'Authorization': 'Bearer $token'},
      );
      if (res.statusCode != 200) return null;
      return jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }
}
