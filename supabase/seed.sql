-- Starter subjects. Safe to re-run, it's ON CONFLICT DO NOTHING.
-- Auth users (admin/tutor/parent accounts) aren't seeded here. auth.users
-- has trigger/constraint requirements that make raw SQL inserts fragile
-- across Supabase versions, so create demo accounts through the app
-- itself instead. See SETUP.md, "Create your accounts," for the steps.

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
