-- Shared exercise catalog used by the current frontend prototype.
-- User-specific plans, sessions, measurements, and records are never seeded.

insert into public.exercise_catalog (id, name, category, equipment, uses_bodyweight)
values
  ('00000000-0000-4000-8000-000000000001', 'Bench Press', 'push', 'barbell', false),
  ('00000000-0000-4000-8000-000000000002', 'Overhead Press', 'push', 'barbell', false),
  ('00000000-0000-4000-8000-000000000003', 'Incline Dumbbell Press', 'push', 'dumbbells', false),
  ('00000000-0000-4000-8000-000000000004', 'Lateral Raises', 'push', 'dumbbells', false),
  ('00000000-0000-4000-8000-000000000005', 'Tricep Pushdown', 'push', 'cable', false),
  ('00000000-0000-4000-8000-000000000006', 'Deadlift', 'pull', 'barbell', false),
  ('00000000-0000-4000-8000-000000000007', 'Barbell Row', 'pull', 'barbell', false),
  ('00000000-0000-4000-8000-000000000008', 'Pull-ups', 'pull', null, true),
  ('00000000-0000-4000-8000-000000000009', 'Face Pulls', 'pull', 'cable', false),
  ('00000000-0000-4000-8000-000000000010', 'Bicep Curls', 'pull', 'dumbbells', false),
  ('00000000-0000-4000-8000-000000000011', 'Squat', 'legs', 'barbell', false),
  ('00000000-0000-4000-8000-000000000012', 'Romanian Deadlift', 'legs', 'barbell', false),
  ('00000000-0000-4000-8000-000000000013', 'Leg Press', 'legs', 'machine', false),
  ('00000000-0000-4000-8000-000000000014', 'Leg Curls', 'legs', 'machine', false),
  ('00000000-0000-4000-8000-000000000015', 'Calf Raises', 'legs', 'machine', false),
  ('00000000-0000-4000-8000-000000000016', 'Incline Bench Press', 'push', 'barbell', false),
  ('00000000-0000-4000-8000-000000000017', 'Dumbbell Shoulder Press', 'push', 'dumbbells', false),
  ('00000000-0000-4000-8000-000000000018', 'Cable Flyes', 'push', 'cable', false),
  ('00000000-0000-4000-8000-000000000019', 'Weighted Pull-ups', 'pull', null, true),
  ('00000000-0000-4000-8000-000000000020', 'Cable Row', 'pull', 'cable', false),
  ('00000000-0000-4000-8000-000000000021', 'Hammer Curls', 'pull', 'dumbbells', false),
  ('00000000-0000-4000-8000-000000000022', 'Front Squat', 'legs', 'barbell', false),
  ('00000000-0000-4000-8000-000000000023', 'Bulgarian Split Squat', 'legs', 'dumbbells', false),
  ('00000000-0000-4000-8000-000000000024', 'Leg Extension', 'legs', 'machine', false)
on conflict do nothing;
