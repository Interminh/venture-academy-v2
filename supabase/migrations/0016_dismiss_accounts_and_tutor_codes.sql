-- Extends the admin-dismiss pattern (0014) to accounts and tutor codes.
-- Same visibility-only behavior: nothing is deleted or disabled, this
-- just clears an item off these two admin list views. A tutor code still
-- needs to be deactivated first, same precondition as clearing a
-- cancelled claim or a deleted student.
--
-- No new RLS policies needed: profiles_update_self_or_admin and
-- tutor_signup_codes_write_admin already grant admins full update rights
-- on both tables.

begin;

alter table profiles add column admin_dismissed_at timestamptz;
alter table tutor_signup_codes add column admin_dismissed_at timestamptz;

commit;
