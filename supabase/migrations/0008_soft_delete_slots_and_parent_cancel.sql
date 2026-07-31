-- Two related fixes:
--
-- 1. Removing an availability slot used to hard-delete the row, which
--    cascades and destroys every claim ever tied to it (including
--    cancelled/rejected history) — silently breaking the "claims are
--    never deleted, full audit trail" invariant the schema otherwise
--    guarantees. Slots are now soft-deleted via `is_active`, so claim
--    history always survives, no matter how a slot goes away.
--
-- 2. A parent had no RLS path to cancel a claim at all — only a tutor
--    (their own, from 'approved') or an admin (any status) could. If a
--    parent removes a slot that a tutor has a pending/approved claim on,
--    the app needs to cancel that claim on the parent's behalf so the
--    tutor isn't left holding a booking for a time that's no longer
--    offered.

begin;

alter table availability_slots add column is_active boolean not null default true;

alter table availability_slots
  drop constraint availability_slots_tutee_id_day_start_time_key;

-- Only one *active* row per (tutee, day, time) — a removed slot can be
-- re-added later as a fresh row without colliding with its own history.
create unique index availability_slots_active_tutee_day_time_key
  on availability_slots (tutee_id, day, start_time)
  where is_active;

-- slot_status should only ever reflect currently-offered slots.
drop view slot_status;

create view slot_status
with (security_invoker = on) as
select
  s.id as slot_id,
  s.tutee_id,
  s.day,
  s.start_time,
  c.id as claim_id,
  c.tutor_id,
  c.subject_id as claimed_subject_id,
  coalesce(c.status::text, 'open') as status
from availability_slots s
left join claims c
  on c.slot_id = s.id and c.status in ('pending', 'approved')
where s.is_active;

grant select, insert, update, delete on availability_slots
  to anon, authenticated, service_role;

-- Lets a parent cancel a live claim tied to one of their own tutee's
-- slots — needed so removing/changing availability can auto-cancel a
-- pending or approved claim instead of either silently keeping it around
-- or being blocked entirely.
create policy "claims_update_parent_cancel" on claims
  for update using (
    auth_role() = 'parent'
    and slot_id in (
      select s.id from availability_slots s
      join tutees t on t.id = s.tutee_id
      where t.parent_id = auth.uid()
    )
  )
  with check (status = 'cancelled');

commit;
