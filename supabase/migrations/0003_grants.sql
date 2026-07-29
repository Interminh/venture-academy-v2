-- Grants the baseline table/schema privileges Supabase's own project
-- bootstrap normally sets up automatically. Without these, RLS policies
-- never even get evaluated — Postgres blocks the query at the privilege
-- check before it gets that far, which is why every role (including
-- service_role) was hitting "permission denied for table profiles" even
-- though the RLS policies themselves were correct.

begin;

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;

grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

-- Ensures any table/sequence added by a future migration gets the same
-- baseline grants automatically, without needing to repeat this file.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

commit;
