-- Starter subjects. Safe to re-run (ON CONFLICT DO NOTHING).
-- Auth users (admin/tutor/parent accounts) aren't seeded here — auth.users
-- has trigger/constraint requirements that make raw SQL inserts fragile
-- across Supabase versions. Create demo accounts through the app itself
-- instead; see SETUP.md "Create your accounts" for the exact steps.

insert into subjects (name) values
  ('Algebra 1'),
  ('Algebra 2'),
  ('Geometry'),
  ('Precalculus'),
  ('Language Arts'),
  ('Reading'),
  ('Writing'),
  ('Science'),
  ('Social Studies'),
  ('Chinese'),
  ('Spanish'),
  ('French')
on conflict (name) do nothing;
