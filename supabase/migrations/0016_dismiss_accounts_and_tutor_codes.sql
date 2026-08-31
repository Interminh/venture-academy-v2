-- Extends the existing admin-dismiss pattern (0014) to accounts and tutor
-- codes. Same visibility-only behavior: dismissing an account or a tutor
-- code never deletes anything or changes what it can do, it only clears
-- it off these two admin list views. An account keeps logging in and
-- working exactly as before; a tutor code just needed to already be
-- deactivated first, same precondition as clearing a cancelled claim or a
-- deleted student.
--
-- No new RLS policies needed: profiles_update_self_or_admin and
-- tutor_signup_codes_write_admin already grant admins full update rights
-- on both tables.

begin;

alter table profiles add column admin_dismissed_at timestamptz;
alter table tutor_signup_codes add column admin_dismissed_at timestamptz;

commit;
