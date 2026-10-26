-- Lets a parent read a tutor's profile once that tutor's claim is approved.

begin;

create policy "profiles_select_approved_parent" on profiles
  for select using (
    id in (
      select c.tutor_id
      from claims c
      join availability_slots s on s.id = c.slot_id
      join tutees t on t.id = s.tutee_id
      where t.parent_id = auth.uid() and c.status = 'approved'
    )
  );

commit;
