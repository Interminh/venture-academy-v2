-- Lets admins hide cancelled claims and deleted students, shared across admins. No new policies needed.

begin;

alter table claims add column admin_dismissed_at timestamptz;
alter table tutees add column admin_dismissed_at timestamptz;

commit;
