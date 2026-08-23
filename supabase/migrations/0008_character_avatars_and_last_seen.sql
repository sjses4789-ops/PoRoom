-- PoRoom: profile character avatar selection + per-room last-seen tracking
-- (used by the redesigned participant card: offline members show a grayscale
-- avatar and "마지막 접속 X 전" instead of a live status).

alter table public.users
  add column if not exists character_id text;

alter table public.room_members
  add column if not exists last_seen_at timestamptz;
