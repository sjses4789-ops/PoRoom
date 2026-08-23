-- Fix: creating a challenge failed with "new row violates row-level security
-- policy for table challenges". The INSERT...RETURNING re-check couldn't
-- reliably see the just-inserted row through the can_view_challenge()
-- helper's self-referencing subquery. Check visibility/created_by directly
-- against the row instead, and only fall back to a subquery for the
-- "existing participant" case (which is only ever read after commit).

drop policy if exists "challenges are viewable when open or joined" on public.challenges;
create policy "challenges are viewable when open or joined"
  on public.challenges for select
  to authenticated
  using (
    visibility = 'open'
    or created_by = auth.uid()
    or exists (
      select 1 from public.challenge_participants cp
      where cp.challenge_id = challenges.id and cp.user_id = auth.uid()
    )
  );
