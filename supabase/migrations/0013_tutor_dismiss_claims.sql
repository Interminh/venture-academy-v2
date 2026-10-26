-- Lets a tutor hide their own cancelled or rejected claims. History is untouched.

begin;

alter table claims add column tutor_dismissed_at timestamptz;

create policy "claims_update_tutor_dismiss" on claims
  for update using (
    tutor_id = auth.uid() and status in ('cancelled', 'rejected')
  )
  with check (
    tutor_id = auth.uid() and status in ('cancelled', 'rejected')
  );

commit;
