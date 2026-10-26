-- Extends admin dismiss to accounts and deactivated tutor codes. No new policies needed.

begin;

alter table profiles add column admin_dismissed_at timestamptz;
alter table tutor_signup_codes add column admin_dismissed_at timestamptz;

commit;
