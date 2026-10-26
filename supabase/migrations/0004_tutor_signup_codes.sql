-- Tutor self-signup codes, validated by a security-definer function so the codes table stays unreadable.

begin;

create table tutor_signup_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table tutor_signup_codes enable row level security;

-- Only admins can see or manage codes.
create policy "tutor_signup_codes_select_admin" on tutor_signup_codes
  for select using (auth_role() = 'admin');

create policy "tutor_signup_codes_write_admin" on tutor_signup_codes
  for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- Lets an unauthenticated signup check a code without exposing the list.
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

-- Explicit grant, see 0003_grants.sql.
grant select, insert, update, delete on tutor_signup_codes
  to anon, authenticated, service_role;

commit;
