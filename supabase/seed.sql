-- Starter subjects, safe to re-run. Create accounts through the app, see SETUP.md.

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
