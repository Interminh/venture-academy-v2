-- One weekly schedule per student, not per subject. Pre-launch test data is cleared, not migrated.

begin;

truncate table claims, availability_slots;

-- Drop the view first, it still reads availability_slots.subject_id.
drop view slot_status;

alter table availability_slots drop constraint availability_slots_tutee_id_subject_id_day_start_time_key;
alter table availability_slots drop column subject_id;
alter table availability_slots
  add constraint availability_slots_tutee_id_day_start_time_key unique (tutee_id, day, start_time);

alter table claims add column subject_id uuid references subjects (id) on delete restrict;
alter table claims alter column subject_id set not null;

grant select, insert, update, delete on availability_slots, claims
  to anon, authenticated, service_role;

-- slot_status now shows the subject of any live claim instead of the slot's own.
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
