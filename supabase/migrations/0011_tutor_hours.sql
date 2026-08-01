-- Lets a tutor log hours worked: date, hours, who it was for (freeform,
-- not tied to a specific claim. A tutor might log time for a student
-- whose booking predates this feature, or for something not modeled as a
-- claim at all), and an optional description. Feeds the admin stats
-- dashboard's "total hours tutored" figure.

begin;

create table tutor_hours (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles (id) on delete cascade,
  session_date date not null,
  hours numeric(4, 2) not null check (hours > 0 and hours <= 24),
  student_label text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table tutor_hours enable row level security;

create policy "tutor_hours_select" on tutor_hours
  for select using (tutor_id = auth.uid() or auth_role() = 'admin');

-- A tutor manages their own entries; an admin can also fix/remove one
-- (e.g. a typo'd hour count) without needing the original tutor's help.
create policy "tutor_hours_write" on tutor_hours
  for all using (tutor_id = auth.uid() or auth_role() = 'admin')
  with check (tutor_id = auth.uid() or auth_role() = 'admin');

grant select, insert, update, delete on tutor_hours to anon, authenticated, service_role;

commit;
