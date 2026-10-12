import 'package:flutter/material.dart';

import '../core/env.dart';
import '../core/theme.dart';

// 웹의 캐릭터 이미지(/characters/char_0001.png)를 그대로 불러와 원형으로 보여준다.
class CharacterAvatar extends StatelessWidget {
  const CharacterAvatar({
    super.key,
    required this.characterId,
    this.size = 32,
    this.borderColor,
  });

  final String? characterId;
  final double size;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final pal = context.pal;
    final id = characterId;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: pal.surfaceAlt,
        border: Border.all(
          color: borderColor ?? pal.line,
          width: borderColor == null ? 1 : 2,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: id == null
          ? Center(
              child: Text('🙂', style: TextStyle(fontSize: size * 0.5)),
            )
          : Image.network(
              '${Env.webUrl}/characters/$id.png',
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Center(
                child: Text('🙂', style: TextStyle(fontSize: size * 0.5)),
              ),
            ),
    );
  }
}
