-- Soft-deletes tutees with is_active so claim history survives.

begin;

alter table tutees add column is_active boolean not null default true;

commit;
