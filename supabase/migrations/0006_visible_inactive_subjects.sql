-- Fixes a data-loss bug: a parent's edit form only ever fetched
-- `is_active = true` subjects (both by its own filter and because RLS
-- already hid inactive ones from non-admins). If an admin deactivated a
-- subject a tutee already needed, that subject's checkbox silently
-- disappeared from the edit form, so the next unrelated save (e.g. just
-- changing the grade) submitted a subject list missing it and
-- `updateTutee` read that as "parent removed this subject," deleting the
-- tutee_subjects row for good.
--
-- The fix needs the parent to actually be able to see the (now inactive)
-- subject's name so it can keep rendering as a checked, still-selected
-- option. This widens `subjects_select` to also allow a subject through
-- when it's already attached to one of the caller's own tutees.

begin;

drop policy "subjects_select" on subjects;

create policy "subjects_select" on subjects
  for select using (
    is_active
    or auth_role() = 'admin'
    or id in (
      select ts.subject_id
      from tutee_subjects ts
      join tutees t on t.id = ts.tutee_id
      where t.parent_id = auth.uid()
    )
  );

commit;
