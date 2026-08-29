-- Lets a tutor clear a cancelled or rejected claim off their own "My
-- sessions" list. This is a per-tutor visibility flag, not a delete: the
-- claim row, its status, and every audit field stay exactly as they are,
-- so the admin ledger is unaffected. Only the tutor who owns the claim
-- can set it, and only once the claim has left the live pending/approved
-- flow, dismissing something still in play would just be a confusing way
-- to hide an active booking.

begin;

alter table claims add column tutor_dismissed_at timestamptz;

create policy "claims_update_tutor_dismiss" on claims
  for update using (
    tutor_id = auth.uid() and status in ('cancelled', 'rejected')
  )
  with check (
    tutor_id = auth.uid() and status in ('cancelled', 'rejected')
  );

commit;
