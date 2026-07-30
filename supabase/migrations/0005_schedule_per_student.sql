-- Moves from "one schedule per student per subject" to "one schedule per
-- student" — a tutee has a single weekly availability grid, and a tutor
-- picks which of the tutee's needed subjects they're claiming a given
-- time slot for at claim time, rather than the subject being baked into
-- the slot itself.
--
-- Pre-launch test data doesn't fit the new shape (it was one row per
-- subject+slot), so it's cleared here rather than migrated — nothing real
-- is lost this early.

begin;

truncate table claims, availability_slots;

-- Must drop the view before dropping the column it reads — slot_status
-- (from 0001) still references availability_slots.subject_id at this point.
drop view slot_status;

alter table availability_slots drop constraint availability_slots_tutee_id_subject_id_day_start_time_key;
alter table availability_slots drop column subject_id;
alter table availability_slots
  add constraint availability_slots_tutee_id_day_start_time_key unique (tutee_id, day, start_time);

alter table claims add column subject_id uuid references subjects (id) on delete restrict;
alter table claims alter column subject_id set not null;

grant select, insert, update, delete on availability_slots, claims
  to anon, authenticated, service_role;

-- slot_status no longer carries a subject (the slot itself has none now);
-- it instead surfaces the subject of whatever live claim exists on it, if
-- any, since that's the only place a subject is attached post-claim.
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
  on c.slot_id = s.id and c.status in ('pending', 'approved');

commit;
