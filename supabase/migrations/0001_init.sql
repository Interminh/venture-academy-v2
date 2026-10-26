-- Initial schema: enums, tables, views, RLS, and the new-user trigger, in one transaction.

begin;

-- Enums

create type user_role as enum ('admin', 'tutor', 'parent');
create type claim_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type weekday as enum ('mon', 'tue', 'wed', 'thu', 'fri');

-- profiles: 1:1 with auth.users, with only an email and display name.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'parent',
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Reads the current user's role. Security definer so RLS policies can call it without recursion.
create function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- Creates a profile from signup metadata. The app decides the role, never the client.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, role, display_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create policy "profiles_select" on profiles
  for select using (id = auth.uid() or auth_role() = 'admin');

-- profiles_select_approved_tutor is added later because it depends on tables not created yet.

create policy "profiles_update_self_or_admin" on profiles
  for update using (id = auth.uid() or auth_role() = 'admin');

-- No insert policy: only the handle_new_user trigger creates profiles.

-- subjects: admin-managed.

create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table subjects enable row level security;

create policy "subjects_select" on subjects
  for select using (is_active or auth_role() = 'admin');

create policy "subjects_write_admin" on subjects
  for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- tutees: the K-8 students, owned by a parent. First name or nickname only.

create table tutees (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles (id) on delete cascade,
  first_name text not null,
  grade smallint not null check (grade between 0 and 8), -- 0 = kindergarten
  notes text,
  created_at timestamptz not null default now()
);

alter table tutees enable row level security;

create policy "tutees_select" on tutees
  for select using (
    parent_id = auth.uid() or auth_role() in ('admin', 'tutor')
  );

create policy "tutees_insert" on tutees
  for insert with check (parent_id = auth.uid() and auth_role() = 'parent');

create policy "tutees_update" on tutees
  for update using (parent_id = auth.uid() or auth_role() = 'admin');

create policy "tutees_delete_admin" on tutees
  for delete using (auth_role() = 'admin');

-- tutee_subjects: subjects a tutee needs.

create table tutee_subjects (
  id uuid primary key default gen_random_uuid(),
  tutee_id uuid not null references tutees (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tutee_id, subject_id)
);

alter table tutee_subjects enable row level security;

create policy "tutee_subjects_select" on tutee_subjects
  for select using (
    auth_role() in ('admin', 'tutor')
    or tutee_id in (select id from tutees where parent_id = auth.uid())
  );

create policy "tutee_subjects_write" on tutee_subjects
  for all using (
    auth_role() = 'admin'
    or tutee_id in (select id from tutees where parent_id = auth.uid())
  )
  with check (
    auth_role() = 'admin'
    or tutee_id in (select id from tutees where parent_id = auth.uid())
  );

-- availability_slots: a tutee's weekly grid. Status is derived from claims so the two can't drift.

create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  tutee_id uuid not null references tutees (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete restrict,
  day weekday not null,
  start_time time not null,
  created_at timestamptz not null default now(),
  unique (tutee_id, subject_id, day, start_time),
  constraint start_time_on_the_half_hour check (
    start_time between time '16:00' and time '20:30'
    and extract(minute from start_time)::int in (0, 30)
  )
);

alter table availability_slots enable row level security;

create policy "availability_slots_select" on availability_slots
  for select using (
    auth_role() in ('admin', 'tutor')
    or tutee_id in (select id from tutees where parent_id = auth.uid())
  );

create policy "availability_slots_write" on availability_slots
  for all using (
    auth_role() = 'admin'
    or tutee_id in (select id from tutees where parent_id = auth.uid())
  )
  with check (
    auth_role() = 'admin'
    or tutee_id in (select id from tutees where parent_id = auth.uid())
  );

-- claims: never deleted, each transition updates the same row for a full audit trail.

create table claims (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references availability_slots (id) on delete cascade,
  tutor_id uuid not null references profiles (id) on delete restrict,
  status claim_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_by uuid references profiles (id),
  decided_at timestamptz,
  cancelled_by uuid references profiles (id),
  cancelled_at timestamptz,
  cancel_reason text
);

-- One live claim per slot, so a second tutor's insert fails instead of racing.
create unique index one_live_claim_per_slot
  on claims (slot_id)
  where status in ('pending', 'approved');

alter table claims enable row level security;

-- Any tutor can see any claim's status so slot_status is accurate. Contact info stays gated behind approval.
create policy "claims_select" on claims
  for select using (
    auth_role() in ('tutor', 'admin')
    or slot_id in (
      select s.id from availability_slots s
      join tutees t on t.id = s.tutee_id
      where t.parent_id = auth.uid()
    )
  );

create policy "claims_insert_tutor" on claims
  for insert with check (auth_role() = 'tutor' and tutor_id = auth.uid());

-- Admins can move a claim to any status.
create policy "claims_update_admin" on claims
  for update using (auth_role() = 'admin');

-- Tutors can only cancel their own claim from approved.
create policy "claims_update_tutor_cancel" on claims
  for update using (tutor_id = auth.uid() and status = 'approved')
  with check (tutor_id = auth.uid() and status = 'cancelled');

-- No delete policy, claims are immutable history.

-- Lets a tutor read a parent's profile only after an approved claim on their tutee.
create policy "profiles_select_approved_tutor" on profiles
  for select using (
    id in (
      select t.parent_id
      from claims c
      join availability_slots s on s.id = c.slot_id
      join tutees t on t.id = s.tutee_id
      where c.tutor_id = auth.uid() and c.status = 'approved'
    )
  );

-- slot_status: derived status for the UI. Approved shows as "Booked" in the app.

create view slot_status
with (security_invoker = on) as
select
  s.id as slot_id,
  s.tutee_id,
  s.subject_id,
  s.day,
  s.start_time,
  c.id as claim_id,
  c.tutor_id,
  coalesce(c.status::text, 'open') as status
from availability_slots s
left join claims c
  on c.slot_id = s.id and c.status in ('pending', 'approved');

-- tutor_visible_contacts: a parent's email, shown to a tutor once their claim is approved.

create view tutor_visible_contacts
with (security_invoker = on) as
select
  t.id as tutee_id,
  p.display_name as parent_display_name,
  p.email as parent_email,
  c.tutor_id
from claims c
join availability_slots s on s.id = c.slot_id
join tutees t on t.id = s.tutee_id
join profiles p on p.id = t.parent_id
where c.status = 'approved';

commit;
