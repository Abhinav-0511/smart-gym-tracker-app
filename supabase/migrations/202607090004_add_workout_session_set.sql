-- Allow adding a set to an exercise during an in-progress or saved workout,
-- mirroring add_plan_set for the planning side. The new set is appended after
-- the current last set (no renumbering needed) and copies the previous set's
-- reps/weight as sensible defaults.

create or replace function public.add_workout_session_set(
  p_session_id uuid,
  p_session_exercise_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  new_set_id uuid;
  last_number integer;
  last_reps integer;
  last_weight numeric;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform 1
  from public.workout_session_exercises as session_exercise
  join public.workout_sessions as session
    on session.id = session_exercise.workout_session_id
  where session_exercise.id = p_session_exercise_id
    and session.id = p_session_id
    and session.user_id = request_user_id
    and session.status in ('in_progress', 'completed')
  for update of session_exercise;
  if not found then
    raise exception 'Workout exercise is not part of an active session.'
      using errcode = 'P0002';
  end if;

  select set_number, reps, weight_kg
  into last_number, last_reps, last_weight
  from public.workout_session_sets
  where workout_session_exercise_id = p_session_exercise_id
  order by set_number desc
  limit 1;

  insert into public.workout_session_sets (
    workout_session_exercise_id, set_number, reps, weight_kg, is_completed
  )
  values (
    p_session_exercise_id,
    coalesce(last_number, 0) + 1,
    coalesce(last_reps, 10),
    last_weight,
    false
  )
  returning id into new_set_id;

  return new_set_id;
end;
$$;

revoke execute on function public.add_workout_session_set(uuid, uuid)
from public, anon;
grant execute on function public.add_workout_session_set(uuid, uuid)
to authenticated;
