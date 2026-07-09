-- ============================================================================
-- MANUAL FIX: "Couldn't remove set" (plan editor + active workout)
-- Paste this ENTIRE file into the Supabase SQL Editor and click "Run".
-- Safe to run multiple times.
--
-- Root cause: the original remove_plan_set / remove_workout_session_set
-- functions run with `search_path = ''` and then call
-- `set constraints <unqualified name> deferred`. With an empty search_path
-- Postgres cannot resolve the constraint name and reports
-- 'constraint "..." does not exist' -- even though the constraint exists.
--
-- Fix: renumber the remaining sets WITHOUT SET CONSTRAINTS, using a two-step
-- offset (shift every row above the current max, then assign 1..N). This never
-- creates a transient duplicate, so it needs no deferrable constraint at all.
-- ============================================================================

-- 1) Plan editor: remove a set from a planned exercise.
create or replace function public.remove_plan_set(p_set_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  target_exercise_id uuid;
  max_number integer;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select plan_set.workout_plan_exercise_id into target_exercise_id
  from public.workout_plan_sets as plan_set
  join public.workout_plan_exercises as exercise
    on exercise.id = plan_set.workout_plan_exercise_id
  join public.workout_plan_days as day
    on day.id = exercise.workout_plan_day_id
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  where plan_set.id = p_set_id and plan.user_id = request_user_id
  for update of exercise;
  if not found then
    raise exception 'The planned set could not be found.' using errcode = 'P0002';
  end if;

  delete from public.workout_plan_sets where id = p_set_id;

  -- Renumber remaining sets contiguously. Step 1 shifts every row above the
  -- current max so no intermediate value collides; step 2 assigns 1..N.
  select coalesce(max(set_number), 0) into max_number
  from public.workout_plan_sets
  where workout_plan_exercise_id = target_exercise_id;

  update public.workout_plan_sets
  set set_number = set_number + max_number
  where workout_plan_exercise_id = target_exercise_id;

  update public.workout_plan_sets as plan_set
  set set_number = numbered.new_number
  from (
    select id, row_number() over (order by set_number, id)::integer as new_number
    from public.workout_plan_sets
    where workout_plan_exercise_id = target_exercise_id
  ) as numbered
  where plan_set.id = numbered.id;

  return true;
end;
$$;

revoke execute on function public.remove_plan_set(uuid) from public, anon;
grant execute on function public.remove_plan_set(uuid) to authenticated;

-- 2) Active/saved workout: remove a set from a session exercise.
create or replace function public.remove_workout_session_set(
  p_session_id uuid,
  p_set_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  target_exercise_id uuid;
  edited_status text;
  remaining_sets integer;
  max_number integer;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select session_set.workout_session_exercise_id, session.status
  into target_exercise_id, edited_status
  from public.workout_session_sets as session_set
  join public.workout_session_exercises as session_exercise
    on session_exercise.id = session_set.workout_session_exercise_id
  join public.workout_sessions as session
    on session.id = session_exercise.workout_session_id
  where session_set.id = p_set_id
    and session.id = p_session_id
    and session.user_id = request_user_id
    and session.status in ('in_progress', 'completed')
  for update of session_exercise;

  if not found then
    raise exception 'Workout set is not part of an active session.'
      using errcode = 'P0002';
  end if;

  select count(*) into remaining_sets
  from public.workout_session_sets
  where workout_session_exercise_id = target_exercise_id;

  if remaining_sets <= 1 then
    raise exception 'An exercise must keep at least one set.'
      using errcode = '23514';
  end if;

  delete from public.workout_session_sets where id = p_set_id;

  select coalesce(max(set_number), 0) into max_number
  from public.workout_session_sets
  where workout_session_exercise_id = target_exercise_id;

  update public.workout_session_sets
  set set_number = set_number + max_number
  where workout_session_exercise_id = target_exercise_id;

  update public.workout_session_sets as session_set
  set set_number = numbered.new_number
  from (
    select id, row_number() over (order by set_number, id)::integer as new_number
    from public.workout_session_sets
    where workout_session_exercise_id = target_exercise_id
  ) as numbered
  where session_set.id = numbered.id;

  if edited_status = 'completed' then
    delete from public.personal_records
    where user_id = request_user_id and source = 'auto';
    perform public.fittrack_reconcile_personal_records(request_user_id);
    perform public.fittrack_reconcile_achievements(request_user_id);
  end if;

  return true;
end;
$$;

revoke execute on function public.remove_workout_session_set(uuid, uuid)
from public, anon;
grant execute on function public.remove_workout_session_set(uuid, uuid)
to authenticated;
