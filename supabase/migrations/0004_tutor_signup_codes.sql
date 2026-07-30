-- Lets tutors self-register at /signup instead of needing an admin-sent
-- email invite (which depends on Supabase's email sending working). A
-- tutor enters a shared code at signup; it's validated server-side via a
-- security-definer function, so an unauthenticated signup request can
-- check a code is valid without ever being able to read the codes table
-- itself (no enumeration of active codes).

begin;

create table tutor_signup_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table tutor_signup_codes enable row level security;

-- Only admins can see or manage the codes list itself.
create policy "tutor_signup_codes_select_admin" on tutor_signup_codes
  for select using (auth_role() = 'admin');

create policy "tutor_signup_codes_write_admin" on tutor_signup_codes
  for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- Callable by anyone (including an unauthenticated signup request) to
-- check a code without exposing which codes exist or how many there are.
create function is_valid_tutor_code(input_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from tutor_signup_codes
    where code = input_code and is_active
  );
$$;

grant execute on function is_valid_tutor_code(text) to anon, authenticated;

-- Explicit, not just relying on the ALTER DEFAULT PRIVILEGES from
-- 0003_grants.sql — see that file for why this base grant matters even
-- though RLS policies already exist above.
grant select, insert, update, delete on tutor_signup_codes
  to anon, authenticated, service_role;

commit;
