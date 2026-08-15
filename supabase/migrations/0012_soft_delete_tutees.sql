-- Lets a parent (or an admin, on a family's behalf) remove a student.
-- Same soft-delete pattern as availability_slots and subjects: tutees
-- get an is_active flag instead of being hard-deleted, so claim history
-- tied to them survives in the admin ledger. The tutees_update policy
-- already covers this (parent_id = auth.uid() or admin), no RLS change
-- needed, this is just a column.

begin;

alter table tutees add column is_active boolean not null default true;

commit;
