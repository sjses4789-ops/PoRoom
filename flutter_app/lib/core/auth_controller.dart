import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'env.dart';

enum AuthStatus { loading, signedOut, signedIn }

class Profile {
  const Profile({
    required this.id,
    this.name,
    this.characterId,
    this.position,
    this.isBanned = false,
  });

  final String id;
  final String? name;
  final String? characterId;
  final String? position; // 'novelist' | 'webtoon'
  final bool isBanned;

  // 처음 가입한 사용자는 닉네임과 직업을 웹 온보딩에서 정해야 한다.
  bool get isComplete => (name ?? '').isNotEmpty && position != null;

  static const preview = Profile(
    id: 'preview-user',
    name: '미리보기',
    characterId: 'char_0001',
    position: 'novelist',
  );
}

// 로그인 상태와 내 프로필을 들고 있다. 웹과 같은 Supabase 프로젝트·같은 계정을 쓰고, 세션은 supabase_flutter가
// 앱 저장소에 보관·자동 갱신한다.
class AuthController extends ChangeNotifier {
  AuthStatus status = AuthStatus.loading;
  Profile? profile;
  StreamSubscription<AuthState>? _sub;

  SupabaseClient get client => Supabase.instance.client;
  // 로그인하지 않은 상태 — 화면은 둘러볼 수 있지만(보기 전용) 쓰기·반응·방 입장 같은 기능은 로그인이 필요하다.
  bool get isGuest => status == AuthStatus.signedOut;
  bool get isSignedIn => status == AuthStatus.signedIn;

  String? get userId => Env.preview ? Profile.preview.id : client.auth.currentUser?.id;

  Future<void> init() async {
    if (Env.preview) {
      if (Env.previewGuest) {
        status = AuthStatus.signedOut;
      } else {
        profile = Profile.preview;
        status = AuthStatus.signedIn;
      }
      notifyListeners();
      return;
    }
    _sub = client.auth.onAuthStateChange.listen((state) => _apply(state.session));
    await _apply(client.auth.currentSession);
  }

  Future<void> _apply(Session? session) async {
    if (session == null) {
      profile = null;
      status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }
    // 같은 사용자의 토큰 갱신 때마다 화면이 로딩으로 돌아가지 않도록, 프로필이 이미 있으면 조용히 새로 읽는다.
    if (profile == null) {
      status = AuthStatus.loading;
      notifyListeners();
    }
    await reloadProfile();
  }

  Future<void> reloadProfile() async {
    final id = client.auth.currentUser?.id;
    if (id == null) return;
    try {
      final row = await client
          .from('users')
          .select('id,name,character_id,position,is_banned')
          .eq('id', id)
          .maybeSingle();
      profile = Profile(
        id: id,
        name: row?['name'] as String?,
        characterId: row?['character_id'] as String?,
        position: row?['position'] as String?,
        isBanned: (row?['is_banned'] as bool?) ?? false,
      );
    } catch (_) {
      profile = Profile(id: id);
    }
    status = AuthStatus.signedIn;
    notifyListeners();
  }

  // 구글 로그인 — 시스템 브라우저로 로그인하고 poroom://auth-callback 으로 앱에 돌아온다(웹과 같은 PKCE 방식).
  // Supabase 대시보드 Redirect URLs 에 poroom://auth-callback 이 등록돼 있어야 한다(기존 Expo 앱과 같은 값).
  Future<String?> signInWithGoogle() async {
    if (Env.preview) {
      // 미리보기에는 서버 연결이 없어서, 로그인 버튼을 누르면 로그인된 것처럼 바꿔 흐름만 보여 준다.
      profile = Profile.preview;
      status = AuthStatus.signedIn;
      notifyListeners();
      return null;
    }
    try {
      await client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: kIsWeb ? null : 'poroom://auth-callback',
        authScreenLaunchMode: kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication,
      );
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> signOut() async {
    if (Env.preview) {
      profile = null;
      status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }
    await client.auth.signOut();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

class AuthScope extends InheritedNotifier<AuthController> {
  const AuthScope({super.key, required AuthController controller, required super.child})
      : super(notifier: controller);

  static AuthController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AuthScope>();
    assert(scope != null, 'AuthScope 가 위젯 트리에 없어요.');
    return scope!.notifier!;
  }
}
