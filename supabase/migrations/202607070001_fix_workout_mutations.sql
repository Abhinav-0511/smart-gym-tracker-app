create or replace function public.update_workout_session_set(
  p_session_id uuid,
  p_set_id uuid,
  p_reps smallint,
  p_reps_provided boolean,
  p_weight_kg numeric,
  p_weight_provided boolean,
  p_is_completed boolean,
  p_completed_provided boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  edited_status text;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not coalesce(p_reps_provided, false)
    and not coalesce(p_weight_provided, false)
    and not coalesce(p_completed_provided, false)
  then
    return true;
  end if;

  update public.workout_session_sets as session_set
  set
    reps = case when p_reps_provided then p_reps else session_set.reps end,
    weight_kg = case
      when p_weight_provided then p_weight_kg
      else session_set.weight_kg
    end,
    is_completed = case
      when p_completed_provided then p_is_completed
      else session_set.is_completed
    end,
    completed_at = case
      when p_completed_provided and p_is_completed then now()
      when p_completed_provided then null
      else session_set.completed_at
    end
  from public.workout_session_exercises as session_exercise
  join public.workout_sessions as session
    on session.id = session_exercise.workout_session_id
  where session_set.id = p_set_id
    and session_set.workout_session_exercise_id = session_exercise.id
    and session.id = p_session_id
    and session.user_id = request_user_id
    and session.status in ('in_progress', 'completed')
  returning session.status into edited_status;

  if not found then
    raise exception 'Workout set is not part of an active session.'
      using errcode = 'P0002';
  end if;

  if edited_status = 'completed' then
    delete from public.personal_records
    where user_id = request_user_id and source = 'auto';
    perform public.fittrack_reconcile_personal_records(request_user_id);
    perform public.fittrack_reconcile_achievements(request_user_id);
  end if;

  return true;
end;
$$;

revoke execute on function public.update_workout_session_set(
  uuid, uuid, smallint, boolean, numeric, boolean, boolean, boolean
)
from public, anon;
grant execute on function public.update_workout_session_set(
  uuid, uuid, smallint, boolean, numeric, boolean, boolean, boolean
)
to authenticated;

create or replace function public.update_workout_session_notes(
  p_session_id uuid,
  p_notes text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  update public.workout_sessions
  set notes = p_notes
  where id = p_session_id
    and user_id = request_user_id
    and status in ('in_progress', 'completed');

  if not found then
    raise exception 'Workout session could not be edited.'
      using errcode = 'P0002';
  end if;

  return true;
end;
$$;

revoke execute on function public.update_workout_session_notes(uuid, text)
from public, anon;
grant execute on function public.update_workout_session_notes(uuid, text)
to authenticated;

create or replace function public.reorder_plan_exercises(
  p_day_id uuid,
  p_ordered_ids uuid[]
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  expected_count integer;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;
  if p_ordered_ids is null
    or cardinality(p_ordered_ids) <> (
      select count(distinct item) from unnest(p_ordered_ids) as item
    )
  then
    raise exception 'Exercise ordering contains duplicate entries.'
      using errcode = '22023';
  end if;

  perform 1
  from public.workout_plan_days as day
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  where day.id = p_day_id and plan.user_id = request_user_id
  for update of day;
  if not found then
    raise exception 'Workout plan day not found.' using errcode = 'P0002';
  end if;

  select count(*) into expected_count
  from public.workout_plan_exercises
  where workout_plan_day_id = p_day_id;

  if expected_count <> cardinality(p_ordered_ids)
    or exists (
      select 1
      from unnest(p_ordered_ids) as requested(id)
      where not exists (
        select 1
        from public.workout_plan_exercises as exercise
        where exercise.id = requested.id
          and exercise.workout_plan_day_id = p_day_id
      )
    )
  then
    raise exception 'Exercise ordering does not match the selected day.'
      using errcode = '22023';
  end if;

  update public.workout_plan_exercises
  set position = position + expected_count
  where workout_plan_day_id = p_day_id;

  update public.workout_plan_exercises as exercise
  set position = requested.position::smallint
  from unnest(p_ordered_ids) with ordinality as requested(id, position)
  where exercise.id = requested.id
    and exercise.workout_plan_day_id = p_day_id;

  return true;
end;
$$;

revoke execute on function public.reorder_plan_exercises(uuid, uuid[])
from public, anon;
grant execute on function public.reorder_plan_exercises(uuid, uuid[])
to authenticated;

drop function if exists public.start_workout_session(uuid);

create or replace function public.start_workout_session(
  p_plan_day_id uuid,
  p_workout_date date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  existing_session_id uuid;
  new_session_id uuid;
  plan_day record;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(request_user_id::text, 0));

  select session.id into existing_session_id
  from public.workout_sessions as session
  where session.user_id = request_user_id and session.status = 'in_progress'
  limit 1;
  if existing_session_id is not null then return existing_session_id; end if;

  select day.id, day.workout_type, day.is_rest_day
  into plan_day
  from public.workout_plan_days as day
  join public.workout_plans as plan on plan.id = day.workout_plan_id
  where day.id = p_plan_day_id and plan.user_id = request_user_id
  for update of day;

  if not found then
    raise exception 'Workout plan day not found.' using errcode = 'P0002';
  end if;
  if plan_day.is_rest_day then
    raise exception 'A rest day cannot be started as a workout.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.workout_sessions as session
    where session.user_id = request_user_id
      and session.workout_plan_day_id = plan_day.id
      and session.workout_date = p_workout_date
      and session.status = 'completed'
  ) then
    raise exception 'This workout has already been completed today.'
      using errcode = '23505';
  end if;

  insert into public.workout_sessions (
    user_id, workout_plan_day_id, workout_date, title, status, started_at
  )
  values (
    request_user_id,
    plan_day.id,
    p_workout_date,
    plan_day.workout_type || ' Day',
    'in_progress',
    now()
  )
  returning id into new_session_id;

  insert into public.workout_session_exercises (
    workout_session_id, exercise_id, workout_plan_exercise_id, position
  )
  select new_session_id, exercise.exercise_id, exercise.id, exercise.position
  from public.workout_plan_exercises as exercise
  where exercise.workout_plan_day_id = plan_day.id
  order by exercise.position;

  insert into public.workout_session_sets (
    workout_session_exercise_id,
    set_number,
    reps,
    weight_kg,
    is_completed,
    completed_at
  )
  select
    session_exercise.id,
    plan_set.set_number,
    plan_set.target_reps,
    plan_set.target_weight_kg,
    false,
    null
  from public.workout_session_exercises as session_exercise
  join public.workout_plan_sets as plan_set
    on plan_set.workout_plan_exercise_id
      = session_exercise.workout_plan_exercise_id
  where session_exercise.workout_session_id = new_session_id;

  return new_session_id;
end;
$$;

revoke execute on function public.start_workout_session(uuid, date)
from public, anon;
grant execute on function public.start_workout_session(uuid, date)
to authenticated;

-- Complete a workout through one authoritative transaction and return the
-- persisted row so callers cannot treat an unverified close as success.
create or replace function public.finalize_workout_session(p_session_id uuid)
returns public.workout_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user_id uuid := (select auth.uid());
  completed_session public.workout_sessions;
begin
  if request_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select session.* into completed_session
  from public.workout_sessions as session
  where session.id = p_session_id
    and session.user_id = request_user_id
    and session.status = 'in_progress'
  for update;

  if not found then
    raise exception 'This workout is already locked.' using errcode = '55000';
  end if;

  update public.workout_session_sets as session_set
  set
    is_completed = true,
    completed_at = coalesce(session_set.completed_at, now())
  from public.workout_session_exercises as session_exercise
  where session_set.workout_session_exercise_id = session_exercise.id
    and session_exercise.workout_session_id = completed_session.id
    and session_set.reps is not null
    and not session_set.is_completed;

  update public.workout_sessions
  set status = 'completed', completed_at = now()
  where id = completed_session.id
  returning * into completed_session;

  perform public.fittrack_reconcile_personal_records(request_user_id);
  perform public.fittrack_reconcile_achievements(request_user_id);

  return completed_session;
end;
$$;

revoke execute on function public.finalize_workout_session(uuid)
from public, anon;
grant execute on function public.finalize_workout_session(uuid)
to authenticated;

-- Repair sessions completed before set completion became part of the final
-- transaction, then rebuild derived PR and achievement data.
update public.workout_session_sets as session_set
set
  is_completed = true,
  completed_at = coalesce(session_set.completed_at, session.completed_at, now())
from public.workout_session_exercises as session_exercise
join public.workout_sessions as session
  on session.id = session_exercise.workout_session_id
where session_set.workout_session_exercise_id = session_exercise.id
  and session.status = 'completed'
  and session_set.reps is not null
  and not session_set.is_completed;

do $$
declare
  target_user record;
begin
  for target_user in select id from public.profiles loop
    perform public.fittrack_reconcile_personal_records(target_user.id);
    perform public.fittrack_reconcile_achievements(target_user.id);
  end loop;
end;
$$;
