-- Closes a privilege-escalation hole in profiles_update_self_or_admin
-- (0001): it lets a user update their own row but never checks which
-- columns change, so any logged-in user could call the Supabase REST API
-- directly and set their own role to admin, bypassing updateUserRole
-- entirely. Verified live against production with a disposable account,
-- then reverted immediately; see TEST_SCENARIOS.md.
--
-- A trigger instead of a with-check clause: a with-check subquery on the
-- same row being updated has MVCC visibility edge cases, a trigger's
-- OLD/NEW don't.
--
-- Only gates the role column. Admins are unaffected (auth_role() =
-- 'admin' short-circuits the check), and every other self-editable field
-- keeps working as before.

begin;

create function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and auth_role() <> 'admin' then
    raise exception 'Only an admin can change a role.';
  end if;
  return new;
end;
$$;

create trigger prevent_self_role_escalation_trigger
  before update on profiles
  for each row execute function prevent_self_role_escalation();

commit;
