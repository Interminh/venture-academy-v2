-- Mirrors profiles_select_approved_tutor (0001), but the other direction:
-- a parent currently has no way to read a tutor's profile at all, even
-- after that tutor's claim on their own tutee is approved. Needed for the
-- parent-facing "Sessions" page, which surfaces the tutor's name + email
-- once a booking is confirmed — same contact-unlock-on-approval model the
-- tutor side already has, just flipped.

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
