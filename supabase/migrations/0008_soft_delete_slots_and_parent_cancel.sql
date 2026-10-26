-- Soft-deletes slots so claim history survives, and lets parents cancel claims on their own tutee's slots.

begin;

alter table availability_slots add column is_active boolean not null default true;

alter table availability_slots
  drop constraint availability_slots_tutee_id_day_start_time_key;

-- One active row per (tutee, day, time), so a removed slot can be re-added.
create unique index availability_slots_active_tutee_day_time_key
  on availability_slots (tutee_id, day, start_time)
  where is_active;

-- Only currently offered slots.
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

-- Lets a parent cancel a live claim on their tutee's slot.
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
