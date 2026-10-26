-- Lets parents see inactive subjects already on their tutees, so a save doesn't drop them.

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
