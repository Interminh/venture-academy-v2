-- Optional weekly session cap per student. Enforced in the UI only, null means no cap.

begin;

alter table tutees add column max_weekly_sessions smallint check (max_weekly_sessions > 0);

commit;
