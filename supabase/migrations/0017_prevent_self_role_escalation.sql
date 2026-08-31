-- Closes a privilege-escalation hole: profiles_update_self_or_admin (0001)
-- lets a user update their own profile row, but has no with-check
-- restricting which columns can change. Since RLS only checks row
-- ownership, not the values being written, any logged-in user could call
-- the Supabase REST API directly (bypassing the app's updateUserRole
-- action entirely) and set their own role to 'admin'. Verified live
-- against production via a disposable test account, then immediately
-- reverted; see TEST_SCENARIOS.md for the full writeup.
--
-- A trigger is used instead of extending the policy's with-check because
-- a with-check subquery referencing the same row being updated has
-- MVCC-visibility edge cases; a trigger's OLD/NEW are unambiguous.
--
-- This only gates the `role` column. Every other self-editable field
-- (display_name, notifications_enabled, etc.) is untouched, and admins
-- are unaffected: auth_role() = 'admin' short-circuits the check, so
-- lib/actions/users.ts's updateUserRole keeps working exactly as before.

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
