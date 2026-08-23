-- PoRoom: nickname-required onboarding, challenge visibility/invite codes,
-- capacity-limited rooms (used by the always-on 마감방 series)

-- 1) stop auto-filling a nickname from the Google profile — users must
--    choose their own before they can use the app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    null,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2) challenges: open (browsable + joinable) vs private (invite-code only)
alter table public.challenges
  add column if not exists visibility text not null default 'open'
    check (visibility in ('open', 'private')),
  add column if not exists invite_code text unique;

create or replace function public.can_view_challenge(target_challenge_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.challenges c
    where c.id = target_challenge_id
      and (
        c.visibility = 'open'
        or c.created_by = auth.uid()
        or exists (
          select 1 from public.challenge_participants cp
          where cp.challenge_id = c.id and cp.user_id = auth.uid()
        )
      )
  );
$$;

drop policy if exists "challenges are viewable by authenticated users" on public.challenges;
drop policy if exists "challenges are viewable when open or joined" on public.challenges;
create policy "challenges are viewable when open or joined"
  on public.challenges for select
  to authenticated
  using (public.can_view_challenge(id));

drop policy if exists "participants are viewable by authenticated users" on public.challenge_participants;
drop policy if exists "participants are viewable when challenge is visible" on public.challenge_participants;
create policy "participants are viewable when challenge is visible"
  on public.challenge_participants for select
  to authenticated
  using (public.can_view_challenge(challenge_id));

drop policy if exists "users can join a user challenge themselves" on public.challenge_participants;
create policy "users can join a user challenge themselves"
  on public.challenge_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3) capacity-limited rooms (마감방, 마감방2, ... cap out at 25 members)
alter table public.rooms
  add column if not exists capacity integer;
