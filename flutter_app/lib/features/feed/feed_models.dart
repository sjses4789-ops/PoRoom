class FeedReaction {
  const FeedReaction(this.count, this.selfActive);

  final int count;
  final bool selfActive;
}

class FeedPostItem {
  const FeedPostItem({
    required this.id,
    required this.postType,
    required this.authorId,
    required this.authorName,
    required this.mood,
    required this.focusMinutes,
    required this.chars,
    required this.meta,
    required this.createdAt,
    required this.reactions,
    this.characterId,
    this.authorPosition = 'novelist',
  });

  final String id;
  final String postType; // write | duel | challenge | submission | contest
  final String authorId;
  final String authorName;
  final String? characterId;
  final String authorPosition;
  final String mood;
  final int focusMinutes;
  final int chars;
  final Map<String, dynamic> meta;
  final DateTime createdAt;
  final Map<String, FeedReaction> reactions; // heart | clap | fire

  FeedPostItem withReaction(String type, FeedReaction next) =>
      FeedPostItem(
        id: id,
        postType: postType,
        authorId: authorId,
        authorName: authorName,
        characterId: characterId,
        authorPosition: authorPosition,
        mood: mood,
        focusMinutes: focusMinutes,
        chars: chars,
        meta: meta,
        createdAt: createdAt,
        reactions: {...reactions, type: next},
      );
}

const reactionTypes = ['heart', 'clap', 'fire'];
const reactionEmoji = {'heart': '❤️', 'clap': '👏', 'fire': '🔥'};
