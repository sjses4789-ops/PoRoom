-- PoRoom: 투표 방식을 찬반/단일 선택/다중 투표 3가지로 정리하고, 다중
-- 투표에서 한 사람이 여러 항목에 투표할 수 있도록 unique 제약을 바꾼다.
alter table public.polls drop constraint if exists polls_poll_type_check;
update public.polls set poll_type = 'single' where poll_type = 'candidates';
alter table public.polls
  add constraint polls_poll_type_check check (poll_type in ('yesno', 'single', 'multi'));

alter table public.poll_votes drop constraint if exists poll_votes_poll_id_voter_id_key;
alter table public.poll_votes
  add constraint poll_votes_poll_id_voter_id_option_id_key unique (poll_id, voter_id, option_id);

drop policy if exists "voters can change their own vote" on public.poll_votes;

drop policy if exists "voters can remove their own vote" on public.poll_votes;
create policy "voters can remove their own vote"
  on public.poll_votes for delete
  to authenticated
  using (auth.uid() = voter_id);
