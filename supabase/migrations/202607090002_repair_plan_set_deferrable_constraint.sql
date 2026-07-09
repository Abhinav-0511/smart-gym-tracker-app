-- Repair schema drift on remote databases where the deferrable uniqueness
-- constraints from 202607030004 were never applied. The remove_plan_set and
-- reorder RPCs defer these constraints by name while renumbering rows, so a
-- missing/misnamed constraint makes those mutations fail with
-- 'constraint "workout_plan_sets_exercise_number_unique" does not exist'.
--
-- Dropping by both the original auto-generated name and the target name keeps
-- this idempotent: it works whether the remote still has the default name, has
-- already been renamed, or is a fresh database.

alter table public.workout_plan_sets
  drop constraint if exists
    workout_plan_sets_workout_plan_exercise_id_set_number_key,
  drop constraint if exists workout_plan_sets_exercise_number_unique,
  add constraint workout_plan_sets_exercise_number_unique
    unique (workout_plan_exercise_id, set_number)
    deferrable initially immediate;

alter table public.workout_plan_exercises
  drop constraint if exists
    workout_plan_exercises_workout_plan_day_id_position_key,
  drop constraint if exists workout_plan_exercises_day_position_unique,
  add constraint workout_plan_exercises_day_position_unique
    unique (workout_plan_day_id, position)
    deferrable initially immediate;
