-- Tutor hour logs, feeding the admin stats total.

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

-- Tutors manage their own entries and admins can fix any.
create policy "tutor_hours_write" on tutor_hours
  for all using (tutor_id = auth.uid() or auth_role() = 'admin')
  with check (tutor_id = auth.uid() or auth_role() = 'admin');

grant select, insert, update, delete on tutor_hours to anon, authenticated, service_role;

commit;
